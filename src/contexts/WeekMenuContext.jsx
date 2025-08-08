import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../components/AuthProvider';

const WeekMenuContext = createContext({});

export const useWeekMenu = () => {
  const context = useContext(WeekMenuContext);
  if (!context) {
    throw new Error('useWeekMenu must be used within a WeekMenuProvider');
  }
  return context;
};

export const WeekMenuProvider = ({ children }) => {
  const { user, subscription } = useAuth();
  const [weekmenu, setWeekmenu] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState(null);
  const syncTimeoutRef = useRef(null);
  const versionRef = useRef(1);

  // Load weekmenu from localStorage on mount
  useEffect(() => {
    const loadLocalMenu = () => {
      try {
        const stored = localStorage.getItem('weekmenu');
        if (stored) {
          const parsed = JSON.parse(stored);
          setWeekmenu(parsed);
          versionRef.current = parsed.version || 1;
        }
      } catch (err) {
        console.error('Error loading weekmenu from localStorage:', err);
      }
    };

    loadLocalMenu();
  }, []);

  // Load weekmenu immediately when user is available
  useEffect(() => {
    console.log('[WeekMenuContext] User effect triggered - user:', user?.id)
    
    if (!user) {
      console.log('[WeekMenuContext] No user, setting loading false')
      setIsLoading(false);
      return;
    }

    // If we already have a weekmenu loaded, don't reload
    if (weekmenu?.seed) {
      console.log('[WeekMenuContext] Weekmenu already loaded with seed:', weekmenu.seed)
      setIsLoading(false);
      return;
    }

    const loadFromDatabase = async () => {
      try {
        setIsLoading(true);
        
        // Check localStorage first for immediate availability
        const localMenu = JSON.parse(localStorage.getItem('weekmenu') || '{}');
        if (localMenu.seed) {
          // Use local menu immediately
          console.log('[WeekMenuContext] Using local menu with seed:', localMenu.seed)
          setWeekmenu(localMenu);
          setIsLoading(false);
          return; // We have what we need
        }
        
        // No local menu, create one immediately so UI can render
        console.log('[WeekMenuContext] No local menu, creating new weekmenu')
        const tempMenu = {
          subscriptionId: null,
          seed: Math.floor(Math.random() * 999999) + 1,
          version: 1,
          recipes: [],
          updatedAt: new Date().toISOString()
        };
        setWeekmenu(tempMenu);
        localStorage.setItem('weekmenu', JSON.stringify(tempMenu));
        setIsLoading(false);
        
        // If we have subscription, we'll sync with database in a separate effect
        if (subscription?.id) {
          // Continue to load from database
        } else {
          return; // No subscription yet, use temp menu
        }
        
        const { data, error } = await supabase
          .from('weekmenus')
          .select('*')
          .eq('subscription_id', subscription.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) {
          throw error;
        }
        
        const weekmenuData = data && data.length > 0 ? data[0] : null;

        if (weekmenuData) {
          const menuData = {
            subscriptionId: weekmenuData.subscription_id,
            seed: weekmenuData.seed,
            version: weekmenuData.version,
            recipes: weekmenuData.recipes,
            updatedAt: weekmenuData.updated_at,
            id: weekmenuData.id
          };
          
          // Compare with localStorage version
          const localMenu = JSON.parse(localStorage.getItem('weekmenu') || '{}');
          if (!localMenu.updatedAt || new Date(weekmenuData.updated_at) > new Date(localMenu.updatedAt)) {
            setWeekmenu(menuData);
            versionRef.current = weekmenuData.version;
            localStorage.setItem('weekmenu', JSON.stringify(menuData));
          }
        } else if (!weekmenu) {
          // No menu in database, create a new one
          const newMenu = {
            subscriptionId: subscription.id,
            seed: Math.floor(Math.random() * 999999) + 1,
            version: 1,
            recipes: [],
            updatedAt: new Date().toISOString()
          };
          setWeekmenu(newMenu);
          localStorage.setItem('weekmenu', JSON.stringify(newMenu));
        }
      } catch (err) {
        console.error('Error loading weekmenu from database:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromDatabase();
  }, [user]); // Only depend on user, not subscription

  // Separate effect to sync with database when subscription becomes available
  useEffect(() => {
    if (!user || !subscription?.id || !weekmenu) return;
    
    // If weekmenu doesn't have a subscription ID, update it
    if (!weekmenu.subscriptionId) {
      console.log('[WeekMenuContext] Updating weekmenu with subscription ID')
      const updatedMenu = { ...weekmenu, subscriptionId: subscription.id };
      setWeekmenu(updatedMenu);
      localStorage.setItem('weekmenu', JSON.stringify(updatedMenu));
      // Sync to database
      syncToDatabase(updatedMenu);
    }
  }, [user, subscription?.id, weekmenu?.subscriptionId]);

  // Debounced sync to database
  const syncToDatabase = useCallback(async (menuData) => {
    if (!user || !subscription?.id) return;

    try {
      setIsSyncing(true);
      
      const dataToSync = {
        subscription_id: menuData.subscriptionId,
        seed: menuData.seed,
        version: menuData.version,
        recipes: menuData.recipes
      };

      if (menuData.id) {
        // Update existing record
        const { error } = await supabase
          .from('weekmenus')
          .update(dataToSync)
          .eq('id', menuData.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('weekmenus')
          .insert([dataToSync])
          .select()
          .single();

        if (error) throw error;
        
        // Update local state with the new ID
        const updatedMenu = { ...menuData, id: data.id };
        setWeekmenu(updatedMenu);
        localStorage.setItem('weekmenu', JSON.stringify(updatedMenu));
      }
    } catch (err) {
      console.error('Error syncing weekmenu to database:', err);
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [user, subscription?.id]);

  // Update weekmenu with debounced sync
  const updateWeekmenu = useCallback((updates) => {
    const newMenu = {
      ...weekmenu,
      ...updates,
      version: versionRef.current + 1,
      updatedAt: new Date().toISOString()
    };
    
    versionRef.current = newMenu.version;
    setWeekmenu(newMenu);
    localStorage.setItem('weekmenu', JSON.stringify(newMenu));

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Set new timeout for debounced sync (5 seconds)
    syncTimeoutRef.current = setTimeout(() => {
      syncToDatabase(newMenu);
    }, 5000);
  }, [weekmenu, syncToDatabase]);

  // Add recipe to menu
  const addRecipe = useCallback((recipeId, servings = subscription?.default_servings || 4) => {
    if (!weekmenu) return;

    const existingIndex = weekmenu.recipes.findIndex(r => r.recipeId === recipeId);
    
    if (existingIndex === -1) {
      updateWeekmenu({
        recipes: [...weekmenu.recipes, { recipeId, servings }]
      });
    }
  }, [weekmenu, updateWeekmenu, subscription?.default_servings]);

  // Remove recipe from menu
  const removeRecipe = useCallback((recipeId) => {
    if (!weekmenu) return;

    updateWeekmenu({
      recipes: weekmenu.recipes.filter(r => r.recipeId !== recipeId)
    });
  }, [weekmenu, updateWeekmenu]);

  // Update recipe servings
  const updateServings = useCallback((recipeId, servings) => {
    if (!weekmenu) return;

    updateWeekmenu({
      recipes: weekmenu.recipes.map(r => 
        r.recipeId === recipeId ? { ...r, servings } : r
      )
    });
  }, [weekmenu, updateWeekmenu]);

  // Clear menu
  const clearMenu = useCallback(() => {
    const newMenu = {
      subscriptionId: subscription?.id || weekmenu?.subscriptionId,
      seed: Math.floor(Math.random() * 999999) + 1,
      version: 1,
      recipes: [],
      updatedAt: new Date().toISOString()
    };
    
    versionRef.current = 1;
    setWeekmenu(newMenu);
    localStorage.setItem('weekmenu', JSON.stringify(newMenu));
    
    // Sync immediately for clear action
    syncToDatabase(newMenu);
  }, [subscription?.id, weekmenu?.subscriptionId, syncToDatabase]);

  // Handle offline/online events
  useEffect(() => {
    const handleOnline = () => {
      // Only update state if actually offline to prevent unnecessary re-renders
      if (isOffline) {
        setIsOffline(false);
        // Sync when coming back online
        if (weekmenu) {
          syncToDatabase(weekmenu);
        }
      }
    };

    const handleOffline = () => {
      // Only update state if actually online to prevent unnecessary re-renders
      if (!isOffline) {
        setIsOffline(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [weekmenu, syncToDatabase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    weekmenu,
    isLoading,
    isSyncing,
    isOffline,
    error,
    addRecipe,
    removeRecipe,
    updateServings,
    clearMenu,
    syncNow: () => weekmenu && syncToDatabase(weekmenu)
  };

  return (
    <WeekMenuContext.Provider value={value}>
      {children}
    </WeekMenuContext.Provider>
  );
};


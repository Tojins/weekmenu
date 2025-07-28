import { supabase } from '../supabaseClient'

// Fetch shopping lists for a subscription
export const fetchShoppingLists = async (subscriptionId) => {
  if (!subscriptionId) return []
  
  const { data, error } = await supabase
    .from('shopping_lists')
    .select(`
      *,
      store:stores(
        id,
        name,
        chain:store_chains(name, logo_url)
      ),
      items:shopping_list_items(count)
    `)
    .eq('subscription_id', subscriptionId)
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw error
  return data || []
}

// Create a new shopping list
export const createShoppingList = async ({ subscriptionId, storeId }) => {
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({
      subscription_id: subscriptionId,
      store_id: storeId,
      is_active: true
    })
    .select(`
      *,
      store:stores(
        id,
        name,
        chain:store_chains(name, logo_url)
      ),
      items:shopping_list_items(count)
    `)
    .single()

  if (error) throw error
  return data
}

// Update a shopping list
export const updateShoppingList = async ({ id, updates }) => {
  const { data, error } = await supabase
    .from('shopping_lists')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      store:stores(
        id,
        name,
        chain:store_chains(name, logo_url)
      ),
      items:shopping_list_items(count)
    `)
    .single()

  if (error) throw error
  return data
}

// Delete a shopping list
export const deleteShoppingList = async (id) => {
  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', id)

  if (error) throw error
  return id
}
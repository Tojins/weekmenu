import { supabase } from '../supabaseClient'

// Fetch shopping lists for a subscription
export const fetchShoppingLists = async (subscriptionId) => {
  console.log('[fetchShoppingLists] Called with subscriptionId:', subscriptionId)
  
  if (!subscriptionId) {
    console.log('[fetchShoppingLists] No subscriptionId provided, returning empty array')
    return []
  }
  
  console.log('[fetchShoppingLists] Making Supabase query for subscription_id:', subscriptionId)
  
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

  console.log('[fetchShoppingLists] Query result:', {
    error: error?.message,
    dataLength: data?.length || 0,
    data: data?.map(list => ({
      id: list.id,
      subscription_id: list.subscription_id,
      store_id: list.store_id,
      is_active: list.is_active,
      store_name: list.store?.name
    }))
  })

  if (error) {
    console.error('[fetchShoppingLists] Query error:', error)
    throw error
  }
  
  const result = data || []
  console.log('[fetchShoppingLists] Returning', result.length, 'lists')
  return result
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
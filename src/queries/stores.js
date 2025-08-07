import { supabase } from '../supabaseClient'

export const fetchStores = async () => {
  const { data, error } = await supabase
    .from('stores')
    .select('*, chain:store_chains(*)')
    .order('name')
  
  if (error) throw error
  return data || []
}

export const fetchStoreById = async (storeId) => {
  if (!storeId) return null
  
  const { data, error } = await supabase
    .from('stores')
    .select('*, chain:store_chains(*)')
    .eq('id', storeId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}
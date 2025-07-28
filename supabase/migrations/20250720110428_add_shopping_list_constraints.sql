-- Add default_store_id to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN default_store_id UUID REFERENCES stores(id);

-- Add unique constraint for active shopping lists per subscription+store
CREATE UNIQUE INDEX idx_unique_active_shopping_list_per_subscription_store 
ON shopping_lists(subscription_id, store_id) 
WHERE is_active = true;

-- Update the shopping_lists table to handle NULL store_id in the unique constraint
-- PostgreSQL treats NULL values as distinct in unique constraints, so we need to handle this
DROP INDEX IF EXISTS idx_unique_active_shopping_list_per_subscription_store;

-- Create a partial unique index that includes NULL store_id
CREATE UNIQUE INDEX idx_unique_active_shopping_list_per_subscription_store 
ON shopping_lists(subscription_id, COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid)) 
WHERE is_active = true;


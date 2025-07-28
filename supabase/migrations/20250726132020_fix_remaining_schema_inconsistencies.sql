-- Fix remaining schema inconsistencies between test and production

-- 1. Remove ON DELETE CASCADE from application foreign keys
-- (keeping auth/storage CASCADE as those are system tables)

-- Remove CASCADE from recipe_url_candidates -> recipe_search_history
ALTER TABLE recipe_url_candidates 
DROP CONSTRAINT IF EXISTS recipe_url_candidates_recipe_search_history_id_fkey;

ALTER TABLE recipe_url_candidates 
ADD CONSTRAINT recipe_url_candidates_recipe_search_history_id_fkey 
FOREIGN KEY (recipe_search_history_id) REFERENCES recipe_search_history(id);

-- Remove CASCADE from shopping_list_items -> shopping_lists
ALTER TABLE shopping_list_items 
DROP CONSTRAINT IF EXISTS shopping_list_items_shopping_list_id_fkey;

ALTER TABLE shopping_list_items 
ADD CONSTRAINT shopping_list_items_shopping_list_id_fkey 
FOREIGN KEY (shopping_list_id) REFERENCES shopping_lists(id);

-- Remove CASCADE from shopping_lists -> subscriptions
ALTER TABLE shopping_lists 
DROP CONSTRAINT IF EXISTS shopping_lists_subscription_id_fkey;

ALTER TABLE shopping_lists 
ADD CONSTRAINT shopping_lists_subscription_id_fkey 
FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);

-- Remove CASCADE from weekmenus -> subscriptions
ALTER TABLE weekmenus 
DROP CONSTRAINT IF EXISTS weekmenus_subscription_id_fkey;

ALTER TABLE weekmenus 
ADD CONSTRAINT weekmenus_subscription_id_fkey 
FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);

-- Note: Keeping users -> auth.users CASCADE as it's a special case
-- where the user profile should be deleted when auth user is deleted

-- 2. Add missing updated_at triggers

-- Add trigger for products
CREATE TRIGGER update_products_updated_at 
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for recipe_ingredients  
CREATE TRIGGER update_recipe_ingredients_updated_at 
BEFORE UPDATE ON recipe_ingredients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for recipe_url_candidates
CREATE TRIGGER update_recipe_url_candidates_updated_at 
BEFORE UPDATE ON recipe_url_candidates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
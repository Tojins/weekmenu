-- Drop existing overly permissive policies and replace with admin-only write policies
-- for tables without subscription_id or FK to subscription tables

-- RECIPES table
DROP POLICY IF EXISTS "Allow public delete access" ON recipes;
DROP POLICY IF EXISTS "Allow public insert access" ON recipes;
DROP POLICY IF EXISTS "Allow public update access" ON recipes;

-- Keep read policy, add admin-only write policies
CREATE POLICY "Only admins can insert recipes" ON recipes
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update recipes" ON recipes
FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete recipes" ON recipes
FOR DELETE USING (is_admin());

-- RECIPE_INGREDIENTS table
-- Keep read policy, add admin-only write policies
CREATE POLICY "Only admins can insert recipe_ingredients" ON recipe_ingredients
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update recipe_ingredients" ON recipe_ingredients
FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete recipe_ingredients" ON recipe_ingredients
FOR DELETE USING (is_admin());

-- PRODUCTS table
-- Keep read policy, add admin-only write policies
CREATE POLICY "Only admins can insert products" ON products
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update products" ON products
FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete products" ON products
FOR DELETE USING (is_admin());

-- INGREDIENT_PRODUCT_CACHE table
DROP POLICY IF EXISTS "Allow public delete ingredient_product_cache" ON ingredient_product_cache;
DROP POLICY IF EXISTS "Allow public insert ingredient_product_cache" ON ingredient_product_cache;
DROP POLICY IF EXISTS "Allow public update ingredient_product_cache" ON ingredient_product_cache;

-- Keep read policy, add admin-only write policies
CREATE POLICY "Only admins can insert ingredient_product_cache" ON ingredient_product_cache
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update ingredient_product_cache" ON ingredient_product_cache
FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete ingredient_product_cache" ON ingredient_product_cache
FOR DELETE USING (is_admin());

-- RECIPE_SEARCH_HISTORY table
DROP POLICY IF EXISTS "Users can insert recipe_search_history" ON recipe_search_history;
DROP POLICY IF EXISTS "Users can update recipe_search_history" ON recipe_search_history;

-- Keep read policy, add admin-only write policies
CREATE POLICY "Only admins can insert recipe_search_history" ON recipe_search_history
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update recipe_search_history" ON recipe_search_history
FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete recipe_search_history" ON recipe_search_history
FOR DELETE USING (is_admin());

-- RECIPE_URL_CANDIDATES table
DROP POLICY IF EXISTS "Users can insert recipe_url_candidates" ON recipe_url_candidates;
DROP POLICY IF EXISTS "Users can update recipe_url_candidates" ON recipe_url_candidates;

-- Keep read policy, add admin-only write policies
CREATE POLICY "Only admins can insert recipe_url_candidates" ON recipe_url_candidates
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update recipe_url_candidates" ON recipe_url_candidates
FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete recipe_url_candidates" ON recipe_url_candidates
FOR DELETE USING (is_admin());

-- STORE_CATEGORIES table
DROP POLICY IF EXISTS "Allow public delete store_categories" ON store_categories;
DROP POLICY IF EXISTS "Allow public insert store_categories" ON store_categories;
DROP POLICY IF EXISTS "Allow public update store_categories" ON store_categories;

-- Keep read policy, add admin-only write policies
CREATE POLICY "Only admins can insert store_categories" ON store_categories
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update store_categories" ON store_categories
FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete store_categories" ON store_categories
FOR DELETE USING (is_admin());

-- STORE_CHAINS table
-- Add admin-only write policies (already has read policy)
CREATE POLICY "Only admins can insert store_chains" ON store_chains
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update store_chains" ON store_chains
FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete store_chains" ON store_chains
FOR DELETE USING (is_admin());

-- STORE_ORDERING table
-- Add admin-only write policies (already has read policy)
CREATE POLICY "Only admins can insert store_ordering" ON store_ordering
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update store_ordering" ON store_ordering
FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete store_ordering" ON store_ordering
FOR DELETE USING (is_admin());

-- STORES table
-- Add admin-only write policies (already has read policy)
CREATE POLICY "Only admins can insert stores" ON stores
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update stores" ON stores
FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete stores" ON stores
FOR DELETE USING (is_admin());

-- SUBSCRIPTIONS table
-- Keep existing policies for users updating their own subscription
-- Add admin policies for full access
CREATE POLICY "Admins can view all subscriptions" ON subscriptions
FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert subscriptions" ON subscriptions
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update any subscription" ON subscriptions
FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete subscriptions" ON subscriptions
FOR DELETE USING (is_admin());
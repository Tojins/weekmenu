-- Fix policies for recipe_search_history and recipe_url_candidates
-- Remove read access for non-admins

-- RECIPE_SEARCH_HISTORY table
DROP POLICY IF EXISTS "Users can read recipe_search_history" ON recipe_search_history;
CREATE POLICY "Only admins can read recipe_search_history" ON recipe_search_history
FOR SELECT USING (is_admin());

-- RECIPE_URL_CANDIDATES table  
DROP POLICY IF EXISTS "Users can read recipe_url_candidates" ON recipe_url_candidates;
CREATE POLICY "Only admins can read recipe_url_candidates" ON recipe_url_candidates
FOR SELECT USING (is_admin());
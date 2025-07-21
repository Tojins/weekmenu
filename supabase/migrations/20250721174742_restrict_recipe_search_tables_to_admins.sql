-- Remove read access for non-admins on recipe_search_history and recipe_url_candidates
-- These tables should be admin-only (no read, write, update, or delete for non-admins)

-- RECIPE_SEARCH_HISTORY table
-- Drop existing read policy
DROP POLICY IF EXISTS "Users can read recipe_search_history" ON recipe_search_history;

-- Add admin-only read policy
CREATE POLICY "Only admins can read recipe_search_history" ON recipe_search_history
FOR SELECT USING (is_admin());

-- RECIPE_URL_CANDIDATES table
-- Drop existing read policy
DROP POLICY IF EXISTS "Users can read recipe_url_candidates" ON recipe_url_candidates;

-- Add admin-only read policy
CREATE POLICY "Only admins can read recipe_url_candidates" ON recipe_url_candidates
FOR SELECT USING (is_admin());
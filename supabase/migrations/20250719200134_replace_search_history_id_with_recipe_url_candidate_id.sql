-- Replace search_history_id with recipe_url_candidate_id in recipes table
-- This provides better traceability: recipe -> url_candidate -> search_history

-- Add new column
ALTER TABLE recipes 
ADD COLUMN recipe_url_candidate_id UUID REFERENCES recipe_url_candidates(id);

-- Create index for the new foreign key
CREATE INDEX idx_recipes_recipe_url_candidate_id ON recipes(recipe_url_candidate_id);

-- Drop old foreign key constraint and index
DROP INDEX IF EXISTS idx_recipes_search_history_id;
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_search_history_id_fkey;

-- Drop old column
ALTER TABLE recipes DROP COLUMN search_history_id;
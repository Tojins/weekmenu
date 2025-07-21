-- Add ONGOING status to recipe_search_history constraints

-- Drop existing check constraint
ALTER TABLE recipe_search_history DROP CONSTRAINT IF EXISTS recipe_search_history_status_check;

-- Add new constraint with ONGOING included
ALTER TABLE recipe_search_history ADD CONSTRAINT recipe_search_history_status_check 
    CHECK (status = ANY (ARRAY['INITIAL'::text, 'ONGOING'::text, 'COMPLETED'::text, 'FAILED'::text]));
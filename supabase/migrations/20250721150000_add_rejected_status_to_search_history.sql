-- Add REJECTED status to recipe_search_history status constraint

-- Drop the existing constraint
ALTER TABLE recipe_search_history DROP CONSTRAINT recipe_search_history_status_check;

-- Add the new constraint with REJECTED included
ALTER TABLE recipe_search_history ADD CONSTRAINT recipe_search_history_status_check 
  CHECK (status IN ('INITIAL', 'ONGOING', 'COMPLETED', 'FAILED', 'REJECTED'));
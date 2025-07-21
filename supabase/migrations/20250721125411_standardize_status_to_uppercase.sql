-- Standardize all status values to uppercase across recipe pipeline tables

-- Drop existing check constraint first
ALTER TABLE recipe_search_history DROP CONSTRAINT IF EXISTS recipe_search_history_status_check;

-- Update all existing data to uppercase
UPDATE recipe_search_history SET status = UPPER(status);

-- Add new constraint with uppercase values
ALTER TABLE recipe_search_history ADD CONSTRAINT recipe_search_history_status_check 
    CHECK (status = ANY (ARRAY['INITIAL'::text, 'COMPLETED'::text, 'FAILED'::text]));

-- Verify recipe_url_candidates already uses uppercase (no change needed)
-- Check constraint: 'INITIAL', 'INVESTIGATING', 'REJECTED', 'ACCEPTED', 'CREATING', 'CREATED'
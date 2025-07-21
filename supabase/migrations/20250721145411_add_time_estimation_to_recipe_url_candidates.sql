-- Add time_estimation_minutes column to recipe_url_candidates table
-- This stores the Phase 3 time estimation to ensure consistency with Phase 4

ALTER TABLE recipe_url_candidates 
ADD COLUMN time_estimation_minutes INTEGER;

-- Add comment to explain the column purpose
COMMENT ON COLUMN recipe_url_candidates.time_estimation_minutes 
IS 'Time estimation in minutes from Phase 3 evaluation, must be d35 for ACCEPTED status';
-- Add time_estimation_minutes column to recipe_url_candidates table
-- This stores the Phase 3 time estimation to ensure consistency with Phase 4

ALTER TABLE recipe_url_candidates 
ADD COLUMN time_estimation_minutes INTEGER;


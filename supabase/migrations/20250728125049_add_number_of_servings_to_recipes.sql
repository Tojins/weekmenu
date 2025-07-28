-- Add number_of_servings column to recipes table
ALTER TABLE recipes ADD COLUMN number_of_servings INTEGER;

-- Add a check constraint to ensure servings is positive
ALTER TABLE recipes ADD CONSTRAINT positive_servings CHECK (number_of_servings > 0);

-- Set a default of 4 servings for existing recipes (typical family meal size)
-- This can be updated later when we extract actual serving info from recipe websites
UPDATE recipes SET number_of_servings = 4 WHERE number_of_servings IS NULL;
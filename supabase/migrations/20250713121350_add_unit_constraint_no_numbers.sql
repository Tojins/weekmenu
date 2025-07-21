-- Add constraint to prevent numeric characters in unit columns
ALTER TABLE products 
ADD CONSTRAINT products_unit_no_numbers 
CHECK (unit !~ '[0-9]');

ALTER TABLE recipe_ingredients 
ADD CONSTRAINT recipe_ingredients_unit_no_numbers 
CHECK (unit !~ '[0-9]');
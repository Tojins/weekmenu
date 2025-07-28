-- Add description column to recipe_ingredients table
ALTER TABLE recipe_ingredients 
ADD COLUMN description text;

-- Update seed data with descriptions for test recipes
UPDATE recipe_ingredients SET description = 'Test Chicken' WHERE id = '00000000-0000-0000-0000-000000000601';
UPDATE recipe_ingredients SET description = 'Test Milk' WHERE id = '00000000-0000-0000-0000-000000000602';
UPDATE recipe_ingredients SET description = 'Test Bread' WHERE id = '00000000-0000-0000-0000-000000000603';
UPDATE recipe_ingredients SET description = 'Test Cheese' WHERE id = '00000000-0000-0000-0000-000000000604';
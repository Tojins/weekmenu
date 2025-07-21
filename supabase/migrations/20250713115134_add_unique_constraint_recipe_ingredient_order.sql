-- Add unique constraint on combination of recipe_id and ingredient_order
ALTER TABLE recipe_ingredients 
ADD CONSTRAINT recipe_ingredients_recipe_id_ingredient_order_unique 
UNIQUE (recipe_id, ingredient_order);
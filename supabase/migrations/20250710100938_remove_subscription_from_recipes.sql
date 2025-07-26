-- Remove subscription_id from recipes and recipe_ingredients tables

-- Drop existing subscription-aware policies for recipes
DROP POLICY IF EXISTS "Users can view recipes in their subscription" ON recipes;
DROP POLICY IF EXISTS "Users can create recipes in their subscription" ON recipes;
DROP POLICY IF EXISTS "Users can update recipes in their subscription" ON recipes;
DROP POLICY IF EXISTS "Users can delete recipes in their subscription" ON recipes;

-- Drop existing subscription-aware policies for recipe_ingredients
DROP POLICY IF EXISTS "Users can view recipe ingredients in their subscription" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can create recipe ingredients in their subscription" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can update recipe ingredients in their subscription" ON recipe_ingredients;
DROP POLICY IF EXISTS "Users can delete recipe ingredients in their subscription" ON recipe_ingredients;

-- Drop existing public policies first
DROP POLICY IF EXISTS "Allow public read access" ON recipes;
DROP POLICY IF EXISTS "Allow public insert access" ON recipes;
DROP POLICY IF EXISTS "Allow public update access" ON recipes;
DROP POLICY IF EXISTS "Allow public delete access" ON recipes;

DROP POLICY IF EXISTS "Allow public read recipe_ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Allow public insert recipe_ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Allow public update recipe_ingredients" ON recipe_ingredients;
DROP POLICY IF EXISTS "Allow public delete recipe_ingredients" ON recipe_ingredients;

-- Recreate public access policies for recipes
CREATE POLICY "Allow public read access" ON recipes
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON recipes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON recipes
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON recipes
    FOR DELETE USING (true);

-- Recreate public access policies for recipe_ingredients
CREATE POLICY "Allow public read recipe_ingredients" ON recipe_ingredients
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert recipe_ingredients" ON recipe_ingredients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update recipe_ingredients" ON recipe_ingredients
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete recipe_ingredients" ON recipe_ingredients
    FOR DELETE USING (true);

-- Drop indexes
DROP INDEX IF EXISTS idx_recipes_subscription_id;
DROP INDEX IF EXISTS idx_recipe_ingredients_subscription_id;

-- Remove columns
ALTER TABLE recipes DROP COLUMN IF EXISTS subscription_id;
ALTER TABLE recipe_ingredients DROP COLUMN IF EXISTS subscription_id;
-- Allow all users to read recipe ingredients (they're public data)
CREATE POLICY "recipe_ingredients_read_policy" ON recipe_ingredients
  FOR SELECT 
  TO anon, authenticated
  USING (true);
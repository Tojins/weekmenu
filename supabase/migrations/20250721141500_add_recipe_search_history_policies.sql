-- Add RLS policies for recipe_search_history table

-- Allow all authenticated users to read recipe_search_history
CREATE POLICY "Users can read recipe_search_history" ON recipe_search_history
FOR SELECT USING (true);

-- Allow all authenticated users to insert recipe_search_history
CREATE POLICY "Users can insert recipe_search_history" ON recipe_search_history
FOR INSERT WITH CHECK (true);

-- Allow all authenticated users to update recipe_search_history
CREATE POLICY "Users can update recipe_search_history" ON recipe_search_history
FOR UPDATE USING (true);
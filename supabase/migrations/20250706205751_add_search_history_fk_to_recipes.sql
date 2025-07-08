-- Add foreign key column to recipes table referencing recipe_search_history
ALTER TABLE recipes
ADD COLUMN search_history_id UUID REFERENCES recipe_search_history(id);

-- Add index for better query performance
CREATE INDEX idx_recipes_search_history_id ON recipes(search_history_id);
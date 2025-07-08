-- Add unique constraint to search_query column
ALTER TABLE recipe_search_history
ADD CONSTRAINT unique_search_query UNIQUE (search_query);
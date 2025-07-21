-- Create functions to get status counts efficiently

-- Function to get recipe_search_history status counts
CREATE OR REPLACE FUNCTION get_recipe_search_history_counts()
RETURNS TABLE(status text, count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT status, COUNT(*) as count
  FROM recipe_search_history
  GROUP BY status
  ORDER BY status;
$$;

-- Function to get recipe_url_candidates status counts
CREATE OR REPLACE FUNCTION get_recipe_url_candidates_counts()
RETURNS TABLE(status text, count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT status, COUNT(*) as count
  FROM recipe_url_candidates
  GROUP BY status
  ORDER BY status;
$$;
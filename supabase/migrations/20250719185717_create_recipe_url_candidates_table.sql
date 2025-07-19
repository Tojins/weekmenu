-- Create recipe_url_candidates table
CREATE TABLE recipe_url_candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_search_history_id UUID REFERENCES recipe_search_history(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('INITIAL', 'INVESTIGATING', 'REJECTED', 'ACCEPTED', 'CREATING', 'CREATED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(url) -- Prevent duplicate URLs
);

-- Create index for efficient status-based queries
CREATE INDEX idx_recipe_url_candidates_status ON recipe_url_candidates(status);
CREATE INDEX idx_recipe_url_candidates_search_history ON recipe_url_candidates(recipe_search_history_id);

-- Add RLS policy (inherit from recipe_search_history access)
ALTER TABLE recipe_url_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read recipe_url_candidates" ON recipe_url_candidates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recipe_search_history rsh
            WHERE rsh.id = recipe_url_candidates.recipe_search_history_id
        )
    );

CREATE POLICY "Users can insert recipe_url_candidates" ON recipe_url_candidates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM recipe_search_history rsh
            WHERE rsh.id = recipe_url_candidates.recipe_search_history_id
        )
    );

CREATE POLICY "Users can update recipe_url_candidates" ON recipe_url_candidates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM recipe_search_history rsh
            WHERE rsh.id = recipe_url_candidates.recipe_search_history_id
        )
    );
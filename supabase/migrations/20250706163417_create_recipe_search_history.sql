-- Create table for storing recipe search history
CREATE TABLE recipe_search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_query TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('initial', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE recipe_search_history ENABLE ROW LEVEL SECURITY;

-- Add index on created_at for ordering
CREATE INDEX idx_recipe_search_history_created_at ON recipe_search_history(created_at DESC);

-- Add index on status for filtering
CREATE INDEX idx_recipe_search_history_status ON recipe_search_history(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recipe_search_history_updated_at 
    BEFORE UPDATE ON recipe_search_history 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
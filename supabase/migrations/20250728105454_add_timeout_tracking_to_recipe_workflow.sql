-- Add timeout tracking to recipe workflow tables

-- Add started_at column to track when processing began
ALTER TABLE recipe_search_history ADD COLUMN started_at TIMESTAMPTZ;
ALTER TABLE recipe_url_candidates ADD COLUMN started_at TIMESTAMPTZ;

-- Create function to automatically set started_at when moving to processing status
CREATE OR REPLACE FUNCTION set_started_at()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_TABLE_NAME = 'recipe_search_history' AND NEW.status = 'ONGOING' AND OLD.status = 'INITIAL') OR
       (TG_TABLE_NAME = 'recipe_url_candidates' AND NEW.status IN ('INVESTIGATING', 'CREATING') AND OLD.status IN ('INITIAL', 'ACCEPTED')) THEN
        NEW.started_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER set_search_history_started_at 
    BEFORE UPDATE ON recipe_search_history 
    FOR EACH ROW 
    EXECUTE FUNCTION set_started_at();

CREATE TRIGGER set_url_candidates_started_at 
    BEFORE UPDATE ON recipe_url_candidates 
    FOR EACH ROW 
    EXECUTE FUNCTION set_started_at();

-- Create views to find stuck records
CREATE VIEW stuck_search_queries AS
SELECT * FROM recipe_search_history 
WHERE status = 'ONGOING' 
AND started_at < NOW() - INTERVAL '10 minutes';

CREATE VIEW stuck_url_candidates AS
SELECT * FROM recipe_url_candidates 
WHERE status IN ('INVESTIGATING', 'CREATING') 
AND started_at < NOW() - INTERVAL '10 minutes';
-- Check if table exists and has data
SELECT * FROM hello_world;

-- If no data, insert a row
INSERT INTO hello_world (message) 
VALUES ('Hello World from Supabase!')
ON CONFLICT DO NOTHING;

-- Verify the data is there
SELECT * FROM hello_world;
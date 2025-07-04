-- Create hello_world table
CREATE TABLE hello_world (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert a test message
INSERT INTO hello_world (message) VALUES ('Hello World from Supabase!');

-- Enable Row Level Security
ALTER TABLE hello_world ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow everyone to read
CREATE POLICY "Allow public read access" ON hello_world
    FOR SELECT
    USING (true);
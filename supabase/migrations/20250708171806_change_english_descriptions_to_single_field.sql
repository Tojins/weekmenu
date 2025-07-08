-- Change english_descriptions array to single english_description text field
-- Drop the existing GIN index
DROP INDEX IF EXISTS idx_products_english_descriptions;

-- Add the new single english_description column
ALTER TABLE products ADD COLUMN english_description TEXT;

-- Migrate existing data: take the first element from the array if it exists
UPDATE products 
SET english_description = CASE 
    WHEN english_descriptions IS NOT NULL AND array_length(english_descriptions, 1) > 0 
    THEN english_descriptions[1]
    ELSE NULL 
END;

-- Drop the old array column
ALTER TABLE products DROP COLUMN english_descriptions;

-- Create an index on the new column for efficient text searches
CREATE INDEX idx_products_english_description ON products (english_description);
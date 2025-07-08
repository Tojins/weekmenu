-- Add english_descriptions array to products table for recipe ingredient matching
ALTER TABLE products
ADD COLUMN english_descriptions TEXT[] DEFAULT '{}';

-- Add GIN index for efficient array searches
CREATE INDEX idx_products_english_descriptions ON products USING GIN (english_descriptions);

-- Add comment explaining the field
COMMENT ON COLUMN products.english_descriptions IS 'Array of English descriptions for matching recipe ingredients to products. Example: {"diced chicken", "chicken blocks"} for a Dutch product name.';
-- Add english_descriptions array to products table for recipe ingredient matching
ALTER TABLE products
ADD COLUMN english_descriptions TEXT[] DEFAULT '{}';

-- Add GIN index for efficient array searches
CREATE INDEX idx_products_english_descriptions ON products USING GIN (english_descriptions);


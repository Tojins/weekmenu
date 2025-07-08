-- Rename price_per_unit column to normalized_price in products table
ALTER TABLE products
RENAME COLUMN price_per_unit TO normalized_price;
-- Add vendor_id field to store_categories table to store external category IDs
ALTER TABLE store_categories
ADD COLUMN vendor_id TEXT UNIQUE;
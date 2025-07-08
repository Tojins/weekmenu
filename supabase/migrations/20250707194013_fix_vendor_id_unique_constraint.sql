-- Remove the single column unique constraint
ALTER TABLE store_categories
DROP CONSTRAINT IF EXISTS store_categories_vendor_id_key;

-- Add composite unique constraint on vendor_id and store_name
ALTER TABLE store_categories
ADD CONSTRAINT unique_vendor_id_store_name UNIQUE (vendor_id, store_name);
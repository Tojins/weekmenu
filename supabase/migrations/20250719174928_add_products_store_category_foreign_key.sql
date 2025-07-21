-- Add foreign key constraint between products.store_category_id and store_categories.id
ALTER TABLE products 
ADD CONSTRAINT fk_products_store_category 
FOREIGN KEY (store_category_id) 
REFERENCES store_categories(id);
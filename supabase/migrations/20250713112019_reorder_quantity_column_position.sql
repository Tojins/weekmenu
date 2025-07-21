-- Reorder quantity column to be between store_category_id and unit
-- PostgreSQL doesn't support moving columns directly, so we need to recreate the table

-- Drop foreign key constraints first
ALTER TABLE recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_product_id_fkey;
ALTER TABLE ingredient_product_cache DROP CONSTRAINT IF EXISTS fk_ingredient_product_cache_product_id;

-- Create new table with correct column order
CREATE TABLE products_new (
    id uuid DEFAULT gen_random_uuid(),
    name text,
    store_category_id uuid,
    quantity numeric,
    unit text DEFAULT 'st'::text,
    normalized_price numeric,
    kcal_per_100 numeric,
    season_start_month integer,
    season_end_month integer,
    labels text[] DEFAULT '{}'::text[],
    colruyt_product_url text,
    image_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    unit_price numeric,
    isweightarticle boolean DEFAULT false,
    brand text,
    walkroutesequencenumber integer,
    english_description text
);

-- Copy data from old table to new table
INSERT INTO products_new SELECT 
    id, name, store_category_id, quantity, unit, normalized_price, kcal_per_100,
    season_start_month, season_end_month, labels, colruyt_product_url, image_url,
    created_at, updated_at, unit_price, isweightarticle, brand, 
    walkroutesequencenumber, english_description
FROM products;

-- Drop old table and rename new table
DROP TABLE products;
ALTER TABLE products_new RENAME TO products;

-- Recreate primary key and foreign key constraints
ALTER TABLE products ADD PRIMARY KEY (id);
ALTER TABLE recipe_ingredients ADD CONSTRAINT recipe_ingredients_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE ingredient_product_cache ADD CONSTRAINT fk_ingredient_product_cache_product_id 
    FOREIGN KEY (product_id) REFERENCES products(id);
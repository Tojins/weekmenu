-- Add ingredient_order column to recipe_ingredients table after recipe_id
-- Need to recreate table to position column correctly

-- Create new table with ingredient_order column in correct position
CREATE TABLE recipe_ingredients_new (
    id uuid DEFAULT gen_random_uuid(),
    recipe_id uuid,
    ingredient_order integer DEFAULT 1,
    product_id uuid,
    quantity numeric,
    unit text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Copy data from old table, setting ingredient_order based on existing order
INSERT INTO recipe_ingredients_new (id, recipe_id, ingredient_order, product_id, quantity, unit, created_at, updated_at)
SELECT 
    id, 
    recipe_id, 
    ROW_NUMBER() OVER (PARTITION BY recipe_id ORDER BY id) as ingredient_order,
    product_id, 
    quantity, 
    unit, 
    created_at, 
    updated_at
FROM recipe_ingredients;

-- Drop old table and rename new table
DROP TABLE recipe_ingredients;
ALTER TABLE recipe_ingredients_new RENAME TO recipe_ingredients;

-- Recreate primary key and foreign key constraints
ALTER TABLE recipe_ingredients ADD PRIMARY KEY (id);
ALTER TABLE recipe_ingredients ADD CONSTRAINT recipe_ingredients_recipe_id_fkey 
    FOREIGN KEY (recipe_id) REFERENCES recipes(id);
ALTER TABLE recipe_ingredients ADD CONSTRAINT recipe_ingredients_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id);
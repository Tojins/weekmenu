-- Complete schema setup for WeekMenu application

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language plpgsql;

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    image_path TEXT,
    time_estimation INTEGER, -- in minutes
    cooking_instructions TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policies for recipes
CREATE POLICY "Allow public read access" ON recipes
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON recipes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON recipes
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON recipes
    FOR DELETE USING (true);

-- Create updated_at trigger for recipes
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'recipe-images',
    'recipe-images',
    true,
    1048576, -- 1MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Allow public viewing of recipe images" ON storage.objects
    FOR SELECT USING (bucket_id = 'recipe-images');

CREATE POLICY "Allow public uploading of recipe images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'recipe-images');

CREATE POLICY "Allow public updating of recipe images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'recipe-images');

CREATE POLICY "Allow public deletion of recipe images" ON storage.objects
    FOR DELETE USING (bucket_id = 'recipe-images');

-- Create store_categories table
CREATE TABLE IF NOT EXISTS store_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_name TEXT NOT NULL,
    category_name TEXT NOT NULL,
    category_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(store_name, category_name)
);

-- Enable RLS for store_categories
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for store_categories
CREATE POLICY "Allow public read store_categories" ON store_categories
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert store_categories" ON store_categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update store_categories" ON store_categories
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete store_categories" ON store_categories
    FOR DELETE USING (true);

-- Create updated_at trigger for store_categories
CREATE TRIGGER update_store_categories_updated_at BEFORE UPDATE ON store_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for store_categories
CREATE INDEX idx_store_categories_lookup ON store_categories(store_name, category_name);

-- Create products table (formerly ingredients)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    store_category_id UUID REFERENCES store_categories(id),
    unit TEXT NOT NULL DEFAULT 'st',
    price_per_unit DECIMAL(10,2),
    kcal_per_100 DECIMAL(10,2),
    season_start_month INTEGER CHECK (season_start_month >= 1 AND season_start_month <= 12),
    season_end_month INTEGER CHECK (season_end_month >= 1 AND season_end_month <= 12),
    labels TEXT[] DEFAULT '{}',
    colruyt_product_url TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Allow public read products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert products" ON products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update products" ON products
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete products" ON products
    FOR DELETE USING (true);

-- Create updated_at trigger for products
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for products
CREATE INDEX idx_products_store_category ON products(store_category_id);

-- Create recipe_ingredients junction table (without notes column)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity DECIMAL(10,3) NOT NULL,
    unit TEXT, -- Can override the product's default unit if needed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(recipe_id, product_id)
);

-- Enable RLS for recipe_ingredients
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Create policies for recipe_ingredients
CREATE POLICY "Allow public read recipe_ingredients" ON recipe_ingredients
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert recipe_ingredients" ON recipe_ingredients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update recipe_ingredients" ON recipe_ingredients
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete recipe_ingredients" ON recipe_ingredients
    FOR DELETE USING (true);

-- Create updated_at trigger for recipe_ingredients
CREATE TRIGGER update_recipe_ingredients_updated_at BEFORE UPDATE ON recipe_ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for recipe_ingredients
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_product ON recipe_ingredients(product_id);
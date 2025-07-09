-- Create ingredient_product_cache table
CREATE TABLE ingredient_product_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_description TEXT NOT NULL,
    product_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- Foreign key constraint
    CONSTRAINT fk_ingredient_product_cache_product_id 
        FOREIGN KEY (product_id) REFERENCES products(id),
    
    -- Unique constraint on ingredient_description
    CONSTRAINT unique_ingredient_description 
        UNIQUE (ingredient_description)
);

-- Create indexes for performance
CREATE INDEX idx_ingredient_product_cache_ingredient_description 
    ON ingredient_product_cache (ingredient_description);

CREATE INDEX idx_ingredient_product_cache_product_id 
    ON ingredient_product_cache (product_id);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_ingredient_product_cache_updated_at
    BEFORE UPDATE ON ingredient_product_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies (following the pattern from other tables)
ALTER TABLE ingredient_product_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read ingredient_product_cache" ON ingredient_product_cache
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert ingredient_product_cache" ON ingredient_product_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update ingredient_product_cache" ON ingredient_product_cache
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete ingredient_product_cache" ON ingredient_product_cache
    FOR DELETE USING (true);
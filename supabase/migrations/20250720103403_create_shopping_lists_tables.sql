-- Create shopping lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    store_id UUID REFERENCES stores(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create shopping list items table
CREATE TABLE IF NOT EXISTS shopping_list_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    custom_name TEXT, -- For custom items not in product database
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit TEXT, -- Unit for the item (e.g., 'g', 'kg', 'st')
    is_checked BOOLEAN DEFAULT false,
    display_order INTEGER, -- Captured from store_ordering at time of adding
    recipe_id UUID REFERENCES recipes(id), -- Track if item came from a recipe
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_product_or_custom CHECK (
        (product_id IS NOT NULL AND custom_name IS NULL) OR 
        (product_id IS NULL AND custom_name IS NOT NULL)
    )
);

-- Add indexes for better performance
CREATE INDEX idx_shopping_lists_subscription_id ON shopping_lists(subscription_id);
CREATE INDEX idx_shopping_lists_is_active ON shopping_lists(is_active);
CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_product_id ON shopping_list_items(product_id);
CREATE INDEX idx_shopping_list_items_recipe_id ON shopping_list_items(recipe_id);

-- Enable Row Level Security
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shopping_lists
CREATE POLICY "Users can view their subscription's shopping lists"
    ON shopping_lists FOR SELECT
    TO authenticated
    USING (subscription_id IN (
        SELECT subscription_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create shopping lists for their subscription"
    ON shopping_lists FOR INSERT
    TO authenticated
    WITH CHECK (subscription_id IN (
        SELECT subscription_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their subscription's shopping lists"
    ON shopping_lists FOR UPDATE
    TO authenticated
    USING (subscription_id IN (
        SELECT subscription_id FROM users WHERE id = auth.uid()
    ))
    WITH CHECK (subscription_id IN (
        SELECT subscription_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete their subscription's shopping lists"
    ON shopping_lists FOR DELETE
    TO authenticated
    USING (subscription_id IN (
        SELECT subscription_id FROM users WHERE id = auth.uid()
    ));

-- Create RLS policies for shopping_list_items
CREATE POLICY "Users can view items in their subscription's shopping lists"
    ON shopping_list_items FOR SELECT
    TO authenticated
    USING (shopping_list_id IN (
        SELECT id FROM shopping_lists WHERE subscription_id IN (
            SELECT subscription_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can add items to their subscription's shopping lists"
    ON shopping_list_items FOR INSERT
    TO authenticated
    WITH CHECK (shopping_list_id IN (
        SELECT id FROM shopping_lists WHERE subscription_id IN (
            SELECT subscription_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can update items in their subscription's shopping lists"
    ON shopping_list_items FOR UPDATE
    TO authenticated
    USING (shopping_list_id IN (
        SELECT id FROM shopping_lists WHERE subscription_id IN (
            SELECT subscription_id FROM users WHERE id = auth.uid()
        )
    ))
    WITH CHECK (shopping_list_id IN (
        SELECT id FROM shopping_lists WHERE subscription_id IN (
            SELECT subscription_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can delete items from their subscription's shopping lists"
    ON shopping_list_items FOR DELETE
    TO authenticated
    USING (shopping_list_id IN (
        SELECT id FROM shopping_lists WHERE subscription_id IN (
            SELECT subscription_id FROM users WHERE id = auth.uid()
        )
    ));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_list_items_updated_at BEFORE UPDATE ON shopping_list_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
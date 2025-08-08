-- Create recipe_ingredient_overrides table
-- This table stores user-specific product replacements for recipe ingredients
CREATE TABLE recipe_ingredient_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_ingredient_id UUID NOT NULL REFERENCES recipe_ingredients(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    custom_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one override per recipe_ingredient per subscription
    UNIQUE(recipe_ingredient_id, subscription_id),
    
    -- Either product_id or custom_name should be set
    CONSTRAINT has_replacement CHECK (
        product_id IS NOT NULL OR custom_name IS NOT NULL
    )
);

-- Create indexes for performance
CREATE INDEX idx_recipe_ingredient_overrides_subscription 
    ON recipe_ingredient_overrides(subscription_id);
CREATE INDEX idx_recipe_ingredient_overrides_recipe_ingredient 
    ON recipe_ingredient_overrides(recipe_ingredient_id);

-- Add RLS policies
ALTER TABLE recipe_ingredient_overrides ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription's overrides
CREATE POLICY "Users can view their subscription overrides" 
    ON recipe_ingredient_overrides FOR SELECT
    USING (
        subscription_id IN (
            SELECT subscription_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Policy: Users can insert overrides for their subscription
CREATE POLICY "Users can insert their subscription overrides" 
    ON recipe_ingredient_overrides FOR INSERT
    WITH CHECK (
        subscription_id IN (
            SELECT subscription_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Policy: Users can update their subscription's overrides
CREATE POLICY "Users can update their subscription overrides" 
    ON recipe_ingredient_overrides FOR UPDATE
    USING (
        subscription_id IN (
            SELECT subscription_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Policy: Users can delete their subscription's overrides
CREATE POLICY "Users can delete their subscription overrides" 
    ON recipe_ingredient_overrides FOR DELETE
    USING (
        subscription_id IN (
            SELECT subscription_id FROM users 
            WHERE id = auth.uid()
        )
    );

-- Add comment for documentation
COMMENT ON TABLE recipe_ingredient_overrides IS 'Stores user-specific product replacements for recipe ingredients. Used to remember user preferences and for future AI-driven recipe improvements.';
COMMENT ON COLUMN recipe_ingredient_overrides.recipe_ingredient_id IS 'The recipe ingredient being overridden';
COMMENT ON COLUMN recipe_ingredient_overrides.subscription_id IS 'The subscription that made this override';
COMMENT ON COLUMN recipe_ingredient_overrides.product_id IS 'The replacement product chosen by the user';
COMMENT ON COLUMN recipe_ingredient_overrides.custom_name IS 'Custom product name if user entered a non-catalog item';
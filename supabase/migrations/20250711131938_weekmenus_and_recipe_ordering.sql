-- Create weekmenus table
CREATE TABLE IF NOT EXISTS weekmenus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  seed INTEGER NOT NULL,
  version INTEGER DEFAULT 1,
  recipes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_weekmenus_subscription ON weekmenus(subscription_id);

-- Add random ordering columns to recipes table
DO $$
BEGIN
  FOR i IN 1..20 LOOP
    EXECUTE format('ALTER TABLE recipes ADD COLUMN IF NOT EXISTS random_order_%s INTEGER', i);
  END LOOP;
END $$;

-- Create indexes for random ordering columns
DO $$
BEGIN
  FOR i IN 1..20 LOOP
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_recipes_random_order_%s ON recipes(random_order_%s)', i, i);
  END LOOP;
END $$;

-- Add default servings to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS default_servings INTEGER DEFAULT 4;

-- Enable RLS on weekmenus
ALTER TABLE weekmenus ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own weekmenus
CREATE POLICY "Users can view own weekmenus" ON weekmenus
  FOR SELECT
  USING (subscription_id = (SELECT subscription_id FROM users WHERE id = auth.uid()));

-- Policy: Users can create weekmenus for their subscription
CREATE POLICY "Users can create own weekmenus" ON weekmenus
  FOR INSERT
  WITH CHECK (subscription_id = (SELECT subscription_id FROM users WHERE id = auth.uid()));

-- Policy: Users can update their own weekmenus
CREATE POLICY "Users can update own weekmenus" ON weekmenus
  FOR UPDATE
  USING (subscription_id = (SELECT subscription_id FROM users WHERE id = auth.uid()));

-- Policy: Users can delete their own weekmenus
CREATE POLICY "Users can delete own weekmenus" ON weekmenus
  FOR DELETE
  USING (subscription_id = (SELECT subscription_id FROM users WHERE id = auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_weekmenus_updated_at
  BEFORE UPDATE ON weekmenus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Populate random_order columns with random values for existing recipes
UPDATE recipes
SET 
  random_order_1 = floor(random() * 1000000)::INTEGER,
  random_order_2 = floor(random() * 1000000)::INTEGER,
  random_order_3 = floor(random() * 1000000)::INTEGER,
  random_order_4 = floor(random() * 1000000)::INTEGER,
  random_order_5 = floor(random() * 1000000)::INTEGER,
  random_order_6 = floor(random() * 1000000)::INTEGER,
  random_order_7 = floor(random() * 1000000)::INTEGER,
  random_order_8 = floor(random() * 1000000)::INTEGER,
  random_order_9 = floor(random() * 1000000)::INTEGER,
  random_order_10 = floor(random() * 1000000)::INTEGER,
  random_order_11 = floor(random() * 1000000)::INTEGER,
  random_order_12 = floor(random() * 1000000)::INTEGER,
  random_order_13 = floor(random() * 1000000)::INTEGER,
  random_order_14 = floor(random() * 1000000)::INTEGER,
  random_order_15 = floor(random() * 1000000)::INTEGER,
  random_order_16 = floor(random() * 1000000)::INTEGER,
  random_order_17 = floor(random() * 1000000)::INTEGER,
  random_order_18 = floor(random() * 1000000)::INTEGER,
  random_order_19 = floor(random() * 1000000)::INTEGER,
  random_order_20 = floor(random() * 1000000)::INTEGER
WHERE random_order_1 IS NULL;
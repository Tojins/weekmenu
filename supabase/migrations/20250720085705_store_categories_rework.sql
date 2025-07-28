-- Create store_chains table
CREATE TABLE IF NOT EXISTS store_chains (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_chain_id UUID NOT NULL REFERENCES store_chains(id),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_chain_id, name)
);

-- Create store_ordering table
CREATE TABLE IF NOT EXISTS store_ordering (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id),
    store_category_id UUID NOT NULL REFERENCES store_categories(id),
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, store_category_id),
    UNIQUE(store_id, display_order)
);

-- Add store_chain_id to store_categories
ALTER TABLE store_categories 
ADD COLUMN IF NOT EXISTS store_chain_id UUID REFERENCES store_chains(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stores_store_chain_id ON stores(store_chain_id);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_store_categories_store_chain_id ON store_categories(store_chain_id);
CREATE INDEX IF NOT EXISTS idx_store_ordering_store_id ON store_ordering(store_id);
CREATE INDEX IF NOT EXISTS idx_store_ordering_store_category_id ON store_ordering(store_category_id);

-- Enable RLS on new tables
ALTER TABLE store_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_ordering ENABLE ROW LEVEL SECURITY;

-- Create read policies for new tables
CREATE POLICY "Store chains are viewable by everyone" ON store_chains
    FOR SELECT USING (true);

CREATE POLICY "Stores are viewable by everyone" ON stores
    FOR SELECT USING (true);

CREATE POLICY "Store ordering is viewable by everyone" ON store_ordering
    FOR SELECT USING (true);

-- Create updated_at triggers for store tables
CREATE TRIGGER update_store_chains_updated_at BEFORE UPDATE ON store_chains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_ordering_updated_at BEFORE UPDATE ON store_ordering
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
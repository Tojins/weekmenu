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
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    is_active BOOLEAN DEFAULT true,
    store_chain_id UUID NOT NULL REFERENCES store_chains(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, store_chain_id)
);

-- Create store_ordering table
CREATE TABLE IF NOT EXISTS store_ordering (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id),
    store_category_id UUID NOT NULL REFERENCES store_categories(id),
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, store_category_id)
);

-- Add store_chain_id to store_categories
ALTER TABLE store_categories 
ADD COLUMN IF NOT EXISTS store_chain_id UUID REFERENCES store_chains(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stores_chain ON stores(store_chain_id);
CREATE INDEX IF NOT EXISTS idx_store_ordering_store ON store_ordering(store_id);
CREATE INDEX IF NOT EXISTS idx_store_ordering_category ON store_ordering(store_category_id);

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
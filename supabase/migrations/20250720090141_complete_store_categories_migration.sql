-- Complete the store categories migration
-- This migration completes the data migration that wasn't fully executed

-- First check if data already exists to make this migration idempotent
DO $$
BEGIN
    -- Only insert if store_chains is empty
    IF NOT EXISTS (SELECT 1 FROM store_chains WHERE name = 'Colruyt') THEN
        -- Insert Colruyt as the first store chain
        INSERT INTO store_chains (name, logo_url) 
        VALUES ('Colruyt', NULL);
    END IF;

    -- Only insert if stores is empty
    IF NOT EXISTS (SELECT 1 FROM stores WHERE name = 'Colruyt Linkeroever') THEN
        -- Insert Colruyt Linkeroever as the first store
        INSERT INTO stores (store_chain_id, name, address, city, postal_code, is_active)
        SELECT 
            sc.id,
            'Colruyt Linkeroever',
            'Blancefloerlaan 181',
            'Antwerpen',
            '2050',
            true
        FROM store_chains sc
        WHERE sc.name = 'Colruyt';
    END IF;

    -- Update store_categories with store_chain_id if not already done
    UPDATE store_categories
    SET store_chain_id = (SELECT id FROM store_chains WHERE name = 'Colruyt')
    WHERE store_name = 'Colruyt' AND store_chain_id IS NULL;

    -- Only insert store_ordering if empty
    IF NOT EXISTS (SELECT 1 FROM store_ordering) THEN
        -- Create store_ordering entries for all existing categories
        INSERT INTO store_ordering (store_id, store_category_id, display_order)
        SELECT 
            s.id AS store_id,
            sc.id AS store_category_id,
            sc.category_order AS display_order
        FROM store_categories sc
        CROSS JOIN stores s
        WHERE s.name = 'Colruyt Linkeroever'
          AND sc.store_name = 'Colruyt';
    END IF;

    -- Now drop the old columns if they still exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'store_categories' 
               AND column_name = 'store_name') THEN
        
        -- Drop the old columns
        ALTER TABLE store_categories 
        DROP COLUMN store_name,
        DROP COLUMN category_order;
        
        -- Add NOT NULL constraint to store_chain_id
        ALTER TABLE store_categories 
        ALTER COLUMN store_chain_id SET NOT NULL;
        
        -- Add new unique constraints
        ALTER TABLE store_categories 
        ADD CONSTRAINT store_categories_store_chain_id_category_name_key UNIQUE (store_chain_id, category_name);
        
        ALTER TABLE store_categories 
        ADD CONSTRAINT store_categories_store_chain_id_external_id_key UNIQUE (store_chain_id, external_id);
        
        -- Update the index for category lookup
        DROP INDEX IF EXISTS idx_store_categories_lookup;
        CREATE INDEX idx_store_categories_chain_category_name ON store_categories(store_chain_id, category_name);
    END IF;
END $$;
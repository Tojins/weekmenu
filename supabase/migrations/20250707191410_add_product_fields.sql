-- Add new fields to products table for Colruyt data mapping
ALTER TABLE products
ADD COLUMN unit_price DECIMAL(10,2),
ADD COLUMN isweightarticle BOOLEAN DEFAULT false,
ADD COLUMN brand TEXT,
ADD COLUMN walkroutesequencenumber INTEGER;
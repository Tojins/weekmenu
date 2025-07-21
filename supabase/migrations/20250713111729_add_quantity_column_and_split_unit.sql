-- Add quantity column between store_category_id and unit
ALTER TABLE products 
ADD COLUMN quantity NUMERIC;

-- Update quantity and unit columns by splitting the existing unit data
UPDATE products 
SET 
    quantity = CASE 
        WHEN unit ~ '^[0-9]+(\.[0-9]+)?[a-zA-Z]' THEN 
            CAST(REGEXP_REPLACE(unit, '^([0-9]+(?:\.[0-9]+)?).*', '\1') AS NUMERIC)
        WHEN unit ~ '^[0-9]+x[0-9]+(\.[0-9]+)?[a-zA-Z]' THEN 
            CAST(REGEXP_REPLACE(unit, '^([0-9]+)x([0-9]+(?:\.[0-9]+)?).*', '\1') AS NUMERIC) * 
            CAST(REGEXP_REPLACE(unit, '^([0-9]+)x([0-9]+(?:\.[0-9]+)?).*', '\2') AS NUMERIC)
        ELSE NULL
    END,
    unit = CASE 
        WHEN unit ~ '^[0-9]+(\.[0-9]+)?[a-zA-Z]' THEN 
            REGEXP_REPLACE(unit, '^[0-9]+(?:\.[0-9]+)?([a-zA-Z]+)', '\1')
        WHEN unit ~ '^[0-9]+x[0-9]+(\.[0-9]+)?[a-zA-Z]' THEN 
            REGEXP_REPLACE(unit, '^[0-9]+x[0-9]+(?:\.[0-9]+)?([a-zA-Z]+)', '\1')
        ELSE unit
    END
WHERE unit IS NOT NULL AND unit != '';
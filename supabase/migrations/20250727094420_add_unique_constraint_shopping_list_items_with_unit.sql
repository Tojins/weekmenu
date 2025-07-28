-- Add unique constraint on shopping_list_items to prevent duplicates
-- The constraint includes unit to allow the same product with different units
-- For example: "2 lemons (st)" and "100g lemon juice (g)" can coexist

-- First, we need to handle any existing duplicates by merging them
-- For UUIDs, we'll use the "earliest" UUID (lowest when cast to text) as the one to keep
WITH duplicates AS (
  SELECT 
    shopping_list_id,
    product_id,
    unit,
    custom_name,
    (array_agg(id ORDER BY id::text))[1] as keep_id,
    SUM(quantity) as total_quantity,
    BOOL_OR(is_checked) as any_checked,
    MIN(display_order) as min_display_order,
    COUNT(*) as duplicate_count
  FROM shopping_list_items
  WHERE product_id IS NOT NULL
  GROUP BY shopping_list_id, product_id, unit, custom_name
  HAVING COUNT(*) > 1
),
items_to_delete AS (
  SELECT sli.id
  FROM shopping_list_items sli
  INNER JOIN duplicates d ON 
    sli.shopping_list_id = d.shopping_list_id 
    AND sli.product_id = d.product_id 
    AND COALESCE(sli.unit, '') = COALESCE(d.unit, '')
    AND COALESCE(sli.custom_name, '') = COALESCE(d.custom_name, '')
  WHERE sli.id != d.keep_id
)
-- Delete duplicate items
DELETE FROM shopping_list_items WHERE id IN (SELECT id FROM items_to_delete);

-- Update the remaining items with summed quantities
WITH duplicates AS (
  SELECT 
    shopping_list_id,
    product_id,
    unit,
    (array_agg(id ORDER BY id::text))[1] as keep_id,
    SUM(quantity) as total_quantity,
    BOOL_OR(is_checked) as any_checked,
    MIN(display_order) as min_display_order
  FROM shopping_list_items
  WHERE product_id IS NOT NULL
  GROUP BY shopping_list_id, product_id, unit
  HAVING COUNT(*) > 1
)
UPDATE shopping_list_items sli
SET 
  quantity = d.total_quantity,
  is_checked = d.any_checked,
  display_order = d.min_display_order
FROM duplicates d
WHERE sli.id = d.keep_id;

-- Now add the unique constraint
-- Note: We use COALESCE to handle NULL units as empty strings for the constraint
ALTER TABLE shopping_list_items 
ADD CONSTRAINT unique_shopping_list_product_unit 
UNIQUE (shopping_list_id, product_id, unit);

-- Also add a constraint for custom items (they should be unique by name within a list)
ALTER TABLE shopping_list_items
ADD CONSTRAINT unique_shopping_list_custom_name
UNIQUE (shopping_list_id, custom_name);

-- Add comment to explain the constraint
COMMENT ON CONSTRAINT unique_shopping_list_product_unit ON shopping_list_items IS 
'Ensures that a product with a specific unit can only appear once per shopping list. Different units of the same product are allowed.';

COMMENT ON CONSTRAINT unique_shopping_list_custom_name ON shopping_list_items IS 
'Ensures that custom items with the same name can only appear once per shopping list.';
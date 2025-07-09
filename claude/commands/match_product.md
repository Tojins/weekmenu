These instructions search the id of the best matching record of the `products` table for a given recipe ingredient string.

1. normalize the ingredient string:
   - remove the quantity (2 tblsp, 50ml, 10g, 1 cup etc.)
   - remove parentheses and content
   - remove punctuation
   - normalize whitespace
   - trim spaces
   - to lowercase
2. Select records from `ingredient_product_cache` where ingredient_description is the normalised recipe ingredient string:
   - if found: finish and return the found product_id in the final report
3. Read `scripts/product_descriptions.json` and select all single word descriptions that have a meaning which more or less corresponds to the recipe ingredient. (e.g. `'pasta'` corresponds to `'brown tagliatelli'`).
   - if none are found: finish and return null in the final report
4. Query the `products` table with placeholder `$1`: Array of single word descriptions from product_descriptions.json (e.g., `['pasta']`)
```sql
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.image_url,
    p.normalized_price,
    sc.category_name
FROM products p
JOIN store_categories sc ON p.store_category_id = sc.id
WHERE p.english_description = ANY($1::text[])
AND (
    p.season_start_month IS NULL 
    OR EXTRACT(MONTH FROM CURRENT_DATE) BETWEEN p.season_start_month AND p.season_end_month
);
```
5. Analyze each product query result to decide if it matches the recipe ingredient:
   - use the category_name
   - use the product_name
   - download and analyze the product image:
     - check if image exists: `images/{product_id}.jpg`
     - if the image does not exist, download: `curl -o images/{product_id}.jpg "{image_url}"`
     - use Read tool to analyze image file
6. if none of the products is an acceptable match: finish and return null in the final report
7. if multiple products are similarly matching: choose the product that has the lowest normalized_price
8. Add the match to the cache: `INSERT INTO ingredient_product_cache (ingredient_description, product_id) VALUES ('{normalized_ingredient}', '{chosen_product_id}');`
9. Return the chosen product_id in the final report

These instructions search the id of the best matching record of the `products` table for a given recipe ingredient string.

1. normalize the ingredient string:
   - remove the quantity (2 tblsp, 50ml, 10g, 1 cup etc.)
   - remove parentheses and content
   - remove punctuation
   - normalize whitespace
   - trim spaces
   - to lowercase
2. Check cache using: `node scripts/db-utils.js find-cached-ingredient "normalized_ingredient"`
   - if result is not "NULL": finish and return the found product_id in the final report
3. Read `scripts/product_descriptions.json` and select all single word descriptions that have a meaning which more or less corresponds to the recipe ingredient. (e.g. `'pasta'` corresponds to `'brown tagliatelli'`).
   - if none are found: finish and return null in the final report
4. Query products using: `node scripts/db_get_products_by_descriptions.js "description1,description2,description3"`
   - Pass comma-separated single word descriptions from product_descriptions.json (e.g., `pasta,noodles`)
5. Analyze each product query result to decide if it matches the recipe ingredient:
   - use the category_name
   - use the product_name
   - download and analyze the product image:
     - check if image exists: `images/{product_id}.jpg`
     - if the image does not exist, download: `curl -o images/{product_id}.jpg "{image_url}"`
     - use Read tool to analyze image file
6. if none of the products is an acceptable match: finish and return null in the final report
7. if multiple products are similarly matching: choose the product that has the lowest normalized_price
8. Add the match to the cache: `node scripts/db-utils.js query "INSERT INTO ingredient_product_cache (ingredient_description, product_id) VALUES ('{normalized_ingredient}', '{chosen_product_id}');"`
9. Return the chosen product_id in the final report

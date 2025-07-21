These instructions search the id of the best matching record of the `products` table for a given recipe ingredient string.

1. Read `scripts/product_descriptions.json` and select all single word descriptions that have a meaning which more or less corresponds to the recipe ingredient. (e.g. `'pasta'` corresponds to `'brown tagliatelli'`).
   - if none are found: finish and return null in the final report
2. Query products using: `node scripts/db_get_products_by_descriptions.js "description1,description2,description3"`
   - Pass comma-separated single word descriptions from product_descriptions.json (e.g., `pasta,noodles`)
3. Analyze each product query result to decide if it matches the recipe ingredient:
   - use the category_name
   - use the product_name
   - download and analyze the product image:
     - check if image exists: `images/{product_id}.jpg`
     - if the image does not exist, download: `curl -o images/{product_id}.jpg "{image_url}"`
     - use Read tool to analyze image file
   - preferably do not match to frozen products, unless it is the only option
4. if none of the products is an acceptable match: finish and return null in the final report
5. if multiple products are similarly matching: choose the product that has the lowest normalized_price
6. Add the match to the cache: `node scripts/db-utils.js query "INSERT INTO ingredient_product_cache (ingredient_description, product_id) VALUES ('{normalized_ingredient}', '{chosen_product_id}');"`
7. Return the chosen product_id in the final report

# Recipe Phase 3: Investigate recipe_url_candidates

Follow these instructions to evaluate recipe URLs and determine if they meet criteria.

## Instructions

- Find in the database a recipe_url_candidates record with status INITIAL using: `node scripts/db-utils.js find-initial-url-candidate`
- Update recipe_url_candidates status to INVESTIGATING where status='INITIAL' and check that the update actually updated a record using: `node scripts/db-utils.js lock-url-candidate "url_candidate_id"`
- Fetch the recipe webpage
- Perform all recipe criteria evaluation and product matching
- Create ingredient_product_cache records during product matching
- Do not create any recipes or recipe_ingredients records yet, that is for phase 4
- Update recipe_url_candidates status to REJECTED or ACCEPTED based on if it matches all criteria using: `node scripts/db-utils.js accept-url-candidate "url_candidate_id"` or `node scripts/db-utils.js reject-url-candidate "url_candidate_id"`

## Recipe Evaluation Criteria

Discard recipes based on these criteria:
- Recipes should be healthy: not too much fat content. Not too much sugar content. Avoid mammal meat.
- Recipes should be complete meals: no soups; there should be at least 2 out of vegetables, protein and carbs (not all 3 need to be present)
- Recipes may not contain cucumber (allergy)
- Recipes should be simple enough to prepare within 35 minutes; **do not believe time estimations from the website; make your own time estimation to verify this**
- Recipes url should not exist yet in the table recipes column url (check using: `node scripts/db-utils.js check-existing-recipe-url "recipe_url"`)

## Product Matching Process

For each recipe ingredient:
1. Normalize the ingredient string:
   - Remove the quantity (2 tblsp, 50ml, 10g, 1 cup etc.)
   - Remove parentheses and content
   - Remove punctuation
   - Normalize whitespace
   - Trim spaces
   - To lowercase
   - DO NOT remove information (e.g. "shredded cheese" is not the same as "cheese")

2. Check cache using: `node scripts/db-utils.js find-cached-ingredient "normalized_ingredient"`
   - If result is not "NULL": use the found product_id
   - If not found: launch parallel Task agents using the Task tool with prompt: "Follow the instructions in claude/commands/match_product.md to find a product_id for this ingredient: [ingredient_name]"

3. If any Task agent's final report returns null or failure:
   - If the Task agent failed due to image processing, try again to execute claude/commands/match_product.md but without a Task agent
   - If the Task agent failed for any other reason, then reject this recipe

4. Check for similar recipes using: `node scripts/db-utils.js check-similar-recipes "product_id1,product_id2,product_id3"`


## Success Criteria

- Successfully process one URL candidate from INITIAL to ACCEPTED or REJECTED status

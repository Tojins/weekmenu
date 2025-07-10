Follow these instructions for searching recipes on the internet and inserting them into the Supabase database.

## Phase 1: Create a Unique Recipe Internet Search Query
- Build an internet search query to search for healthy, fast recipes
- Try to make the search query different by including a random product name:
   - Select a random vegetable from `scripts/product_descriptions.json` that is common in recipes
   - Each subsequent attempt to make the query unique can have a random vegetable that is a little bit less common in recipes
- Verify query uniqueness by trying an insert on a table having a unique constraint. Use: `node scripts/db-utils.js insert-search-history "search query text"`
- DO NOT execute the actual web search yet - that happens in Phase 2

## Phase 2: Find and insert recipes
Search the internet using the unique query to find recipes.
- Try to iterate until at least 3 recipes pass all criteria.
- Because you can expect more than half of the found recipes to not pass all criteria, evaluate more than 3 websites at a time
**CRITICAL RULE**: DO NOT modify or create a new search query. You MUST use the EXACT search query that was inserted into recipe_search_history. Any other search query is forbidden.
For each recipe:
- Discard recipes based on these criteria:
   - Recipes should be healthy: not too much fat content. Not too much sugar content. Avoid mammal meat.
   - Recipes should be complete meals: no soups; there should be at least 2 out of vegetables, protein and carbs (not all 3 need to be present)
   - Recipes may not contain cucumber (allergy)
   - Recipes should be simple enough to prepare within 30 minutes; do not believe time estimations from the website; make your own time estimation to verify this
- Create a unique list of ingredients from the recipe (removing duplicates and combining similar ingredients like "parmesan" and "parmesan for garnish")
- Filter out common pantry items that don't need to be tracked: salt, pepper, olive oil and other extremely common items that are always present in every european household
- For each remaining unique ingredient:
  1. normalize the ingredient string:
     - remove the quantity (2 tblsp, 50ml, 10g, 1 cup etc.)
     - remove parentheses and content
     - remove punctuation
     - normalize whitespace
     - trim spaces
     - to lowercase
     - DO NOT remove information (e.g. "shredded cheese" is not the same as "cheese")
  2. Check cache using: `node scripts/db-utils.js find-cached-ingredient "normalized_ingredient"`
     - if result is not "NULL": use the found product_id
     - if not found: launch parallel Task agents using the Task tool with prompt: "Follow the instructions in claude/commands/match_product.md to find a product_id for this ingredient: [ingredient_name]"
- If any Task agent's final report returns null or failure:
   - if the Task agent failed due to image processing, try again to execute claude/commands/match_product.md but without a Task agent
   - if the Task agent failed for any other reason, then discard this recipe
- If a similar recipe with almost all the same ingredients is found, then discard this recipe. Check using: `node scripts/db-utils.js check-similar-recipes "product_id1,product_id2,product_id3"`
- Insert into `recipes` and for each matching product_id into `recipe_ingredients`
   - Extract all `recipes` field values from the recipe website (just analyse the website, do not write a new parsing script)
   - Transform all temperature references to C, all volume quantities to ml and all weight quantities to g
   - Translate the recipe title and cooking_instructions to dutch
   - Verify translation errors in the title and cooking_instructions
   - Format cooking instructions as numbered steps for better readability
   - Remove all salt (but not pepper) references from cooking instructions
   - When cooking instructions reference named ingredient groups (like "the sauce ingredients", "marinade", "dressing mixture"), expand those references to list the actual ingredients inline (e.g. "Make the sauce with honey, soy sauce, and cornstarch")
   - Select the website image that shows the finished dish and use its url for image_url
   - Insert recipe using: `node scripts/db-utils.js insert-recipe "title" "cooking_instructions" time_estimation "url" "search_history_id" "image_url"`
   - Insert ingredients using: `node scripts/db-utils.js insert-recipe-ingredients "recipe_id" "product_id1:quantity1:unit1,product_id2:quantity2:unit2,..."`

## Phase 3: Update the search query record
Update the record that was created in `recipe_search_history` status to 'completed' using: `node scripts/db-utils.js update-search-history "search_history_id" "completed"`

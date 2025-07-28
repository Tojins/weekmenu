# Recipe Phase 4: Create recipes

Follow these instructions to create complete recipe records from accepted URL candidates.

**IMPORTANT: Do not use custom SQL queries with `node scripts/db-utils.js query`. Only use the specific db-utils commands provided in these instructions.**

## Instructions

- Find in the database a recipe_url_candidates record with status ACCEPTED using: `node scripts/db-utils.js find-accepted-url-candidate`
- Update recipe_url_candidates status to CREATING where status='ACCEPTED' and check that the update actually updated a record (this atomic status-based locking is ideal for AI workflows) using: `node scripts/db-utils.js lock-accepted-url-candidate "url_candidate_id"`
- Fetch the recipe webpage using the WebFetch tool
- Process all ingredients and verify product matches from cache
- Create the recipes and recipe_ingredients records using the time_estimation_minutes from Phase 3
- Release the lock by marking URL candidate as CREATED using: `node scripts/db-utils.js mark-url-candidate-created "url_candidate_id"`

## Ingredient Processing

**Extract and prepare recipe data:**
- Extract all recipe field values (title, cooking instructions, ingredients, etc.)
- Extract the number of servings/portions from the recipe (look for "Serves", "Servings", "Makes", "Yield" or similar indicators)
  - If servings information cannot be found, use NULL (not a default value)
- Transform all temperature references in the cooking_instructions to Celsius
- Translate the recipe title and cooking_instructions to Dutch
- Verify translation errors in the title and cooking_instructions
- Format cooking instructions as numbered steps with line endings between each step for better readability
- Remove all salt (but not pepper) references from cooking instructions
- When cooking instructions reference named ingredient groups (like "the sauce ingredients", "marinade", "dressing mixture"), expand those references to list the actual ingredients inline (e.g. "Make the sauce with honey, soy sauce, and cornstarch")

**Select recipe image:**
- Select the website image that shows the finished dish and use its url for image_url
- Verify that the image_url is a working url

**Process ingredients:**
- Create a unique list of ingredients from the recipe (removing duplicates and combining similar ingredients)
- Filter out common pantry items that don't need to be tracked: salt, pepper, olive oil and other extremely common items
- For each remaining unique ingredient:
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
     - If cache miss (not found): launch Task agent using the Task tool with prompt: "Follow the instructions in claude/commands/match_product.md to find a product_id for this ingredient: [ingredient_name]"
     - If Task agent fails:
       - If the Task agent failed due to image processing, try again to execute claude/commands/match_product.md but without a Task agent
       - If the Task agent failed for any other reason, reject this recipe by updating status to REJECTED using: `node scripts/db-utils.js reject-url-candidate "url_candidate_id"` and stop processing
  3. Transform the unit of the ingredient to match the unit of the chosen product (e.g. 1 cup corresponds to 340g, "st" is the Dutch abbreviation for piece(s))
  4. Translate the original ingredient description (as it appears on the website before normalization, but without quantity+unit) to Dutch for dutch_description (e.g. "freshly grated parmesan cheese" becomes "vers geraspte parmezaanse kaas", not just "kaas")

## Recipe Creation

**Create recipe and recipe ingredients:**
- **Use the time_estimation_minutes from Phase 3** (retrieved from the recipe_url_candidates table) for consistency
- Insert recipe using: `node scripts/db-utils.js insert-recipe "title" "cooking_instructions" time_estimation "url" "recipe_url_candidate_id" "image_url" number_of_servings`
  - If servings information was not found, omit the last parameter (it will be stored as NULL)
- Insert recipe ingredients using: `node scripts/db-utils.js insert-recipe-ingredients "recipe_id" "product_id1:quantity1:unit1[:dutch_description1],product_id2:quantity2:unit2[:dutch_description2],..."`


## Success Criteria

- Successfully process one URL candidate from ACCEPTED to CREATED status
- Create complete recipe record with all required fields
- Create all recipe_ingredients records with proper units and Dutch descriptions

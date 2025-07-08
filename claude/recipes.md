Follow these instructions for searching recipes on the internet and inserting them into the Supabase database.

## Phase 1: Create a Unique Recipe Internet Search Query
- Build an internet search query to search for healthy, fast recipes
- Try to make the query different by including a random product name:
   - Generate a random vegetable ingredient that is not too uncommon in recipes
   - Verify that a matching product exists in the `products` table
- Verify query uniqueness by trying to insert the query into `recipe_search_history` with status 'initial'

## Phase 2: Find and insert recipes
Search the internet using the unique query to find recipes. For each found recipe:
- Discard recipes based on these criteria:
   - Recipes should be healthy: limited fat, sugar and salt. Avoid mammal meat.
   - Recipes may not contain cucumber (allergy)
   - Recipes should be simple enough to prepare within 30 minutes; make your own time estimation to verify this
- For each ingredient in the recipe find a matching ingredient product in the `products` table
- If the recipe contains any ingredient that has no properly matching ingredient product, then discard this recipe
- If a similar recipe with 80% or more matching ingredient products is found, then discard this recipe. Use the following query template to find the maximum number of matching ingredient products (replace the product_id list with the matching ingredient products):
```sql
SELECT MAX(match_count) as max_matching_ingredients
FROM (
    SELECT recipe_id, COUNT(*) as match_count
    FROM recipe_ingredients
    WHERE ingredient_id IN ('id1', 'id2', 'id3')  -- your ingredient IDs
    GROUP BY recipe_id
) matches;
```
- Insert into `recipes` and for each matching ingredient product into `recipe ingredients`
   - Extract all `recipes` field values from the recipe website (just parse it, do not write a new script)
   - Translate the recipe title and cooking_instructions to dutch

## Phase 3: Update the search query record
Update the record that was created in `recipe_search_history` status to 'completed'

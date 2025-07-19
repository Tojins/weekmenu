break up the recipe insertion procedure into steps by creating a new instructions markdown file for each step and more persistence to track progress

## existing tables
- recipe_search_history: stores web search queries

## existing files
- claude/commands/recipes.md
- claude/commands/match_product.md

## tables to create
- recipe_url_candidates: websites possibly containing a recipe that is or was evaluated
   - references recipe_search_history
   - url
   - status: INITIAL, INVESTIGATING, REJECTED, ACCEPTED, CREATED

## updated procedure

### phase 1: Create Multiple Unique Recipe Internet Search Queries
- Select up to 50 records from recipe_search_history to get examples for queries that were already performed
- Generate 5-10 unique search queries per session using different combinations:
  - All queries should include "recipe"
  - Select different vegetables from `scripts/product_descriptions.json`
  - Select different carbs or proteins from `scripts/product_descriptions.json`
  - Vary query structure and additional keywords for diversity
- For each generated query, verify uniqueness by trying an insert on recipe_search_history with status INITIAL
- Continue generating until 5-10 successful unique queries are inserted
- This batching ensures adequate AI session duration (5-15 minutes)

### phase 2: create recipe_url_candidates
iterate:
- find in the database a recipe_search_history record with status INITIAL
- update recipe_search_history status to ONGOING where status='INITIAL' and check that the update actually updated a record (this atomic status-based locking is ideal for AI workflows)
- perform the internet search query
- insert records in recipe_url_candidates for each search result that merits further investigation and does not exist yet. Insert with status INITIAL
- do not perform detailed investigation of the recipe_url_candidate yet, that is for phase 3
- update recipe_search_history status to COMPLETED

### phase 3: investigate recipe_url_candidates
iterate:
- find in the database a recipe_url_candidates record with status INITIAL
- update recipe_url_candidates status to INVESTIGATING where status='INITIAL' and check that the update actually updated a record (this atomic status-based locking is ideal for AI workflows)
- fetch the recipe webpage
- perform all steps as described in recipes.md phase 2 that are related to recipe criteria and product matching (do not reference the file, write instructions based on recipes.md)
- but ingredient_product_cache records are created during product matching
- do not create the recipes or recipe_ingredients records yet, that is for phase 4
- update recipe_url_candidates status to REJECTED or ACCEPTED based on if it matches all criteria or not

### phase 4: create recipes
iterate:
- find in the database a recipe_url_candidates record with status ACCEPTED
- update recipe_url_candidates status to CREATING where status='ACCEPTED' and check that the update actually updated a record (this atomic status-based locking is ideal for AI workflows)
- fetch the recipe webpage
- do the product matching using the ingredient_product_cache as described in recipes.md phase 2 (do not reference the file, write instructions based on recipes.md)
- create the recipes and recipe_ingredients as described in recipes.md phase 2 (do not reference the file, write instructions based on recipes.md)
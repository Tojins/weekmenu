# Recipe Phase 2: Create recipe_url_candidates

Follow these instructions to process search queries and create recipe URL candidates.

## Instructions

Iterate through available search queries:
- Find in the database a recipe_search_history record with status INITIAL using: `node scripts/db-utils.js find-initial-search-query`
- Update recipe_search_history status to ONGOING where status='INITIAL' and check that the update actually updated a record using: `node scripts/db-utils.js lock-search-query "search_history_id"`
- Perform the internet search query using the EXACT search query text from the database
- Insert records in recipe_url_candidates for each search result that merits further investigation using: `node scripts/db-utils.js insert-url-candidate "search_history_id" "recipe_url"` (the unique constraint on URL will prevent duplicates automatically)
- Do not perform detailed investigation of the recipe_url_candidate yet, that is for phase 3
- Update recipe_search_history status to COMPLETED using: `node scripts/db-utils.js complete-search-query "search_history_id"`

## Search Criteria

When evaluating search results for URL insertion:
- URLs should point to recipe websites (not shopping sites, forums, or unrelated content)  
- Include 5-20 promising URLs per search query
- **Important context**: You can expect more than half of the found recipes to not pass all criteria in Phase 3, so collect enough URLs to ensure at least 1 recipe will eventually pass all criteria


## Success Criteria

- Successfully process one search query from INITIAL to COMPLETED status
- Insert 5-20 recipe URL candidates with status INITIAL

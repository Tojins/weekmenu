# Recipe Phase 1: Create Multiple Unique Recipe Internet Search Queries

Follow these instructions to generate multiple unique search queries for recipe discovery.

**IMPORTANT: Do not use custom SQL queries with `node scripts/db-utils.js query`. Only use the specific db-utils commands provided in these instructions.**

## Instructions

- Select up to 50 records from recipe_search_history to get examples for queries that were already performed using: `node scripts/db-utils.js get-recent-search-queries 50`
- Generate 5-10 unique search queries per session using different combinations:
  - All queries should include "recipe"
  - Select per query 1 vegetable from `scripts/product_descriptions.json`
  - Select per query 1 carbs or proteins from `scripts/product_descriptions.json`
  - Vary query structure and additional keywords for diversity
  - No 'breakfast' in queries
- For each generated query, verify uniqueness by trying an insert on recipe_search_history with status INITIAL using: `node scripts/db-utils.js insert-search-history "search query text"`
- Continue generating until 5-10 successful unique queries are inserted
- **CRITICAL RULE**: DO NOT execute the actual web search yet - that happens in Phase 2

## Success Criteria

- Successfully insert 5-10 search queries with status INITIAL
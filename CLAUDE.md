# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Bash Commands

```bash
# Supabase CLI:
npm run db:push          # Push migrations to remote
npm run migration:new    # Create new migration
```

## Database Access

```bash
# Database utility for AI development (bypasses RLS)
node scripts/db-utils.js <command> [args...]

# Available commands:
node scripts/db-utils.js query "SELECT * FROM recipes;"
node scripts/db-utils.js insert-recipe "title" "instructions" 30 "url" "search_history_id" "image_url"
node scripts/db-utils.js insert-recipe-ingredients "recipe_id" "product_id:quantity:unit,..."
node scripts/db-utils.js check-similar-recipes "product_id1,product_id2,..."
node scripts/db-utils.js insert-search-history "search_text" "user_id"
node scripts/db-utils.js update-search-history "id" "new_search_text"

# Direct psql access (if needed)
source .env.local && psql "postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres" -c "TRUNCATE TABLE products;"
```

## Architecture

### Tech Stack
- **React 18** with Vite - Entry: `index.html` → `src/main.jsx` → `src/App.jsx`
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Backend database service, client in `src/supabaseClient.js`

### Key Notes
- Base path is `/weekmenu/` for GitHub Pages (set in `vite.config.js`)
- Automatic deployment to GitHub Pages on push to main branch
- No testing framework or linting configured
- Supabase credentials are hardcoded in the client (typical for public anon key)

### Development Notes
- This is a small-scale personal project
- The production Supabase database can be used for development and testing
- The GitHub main branch can be used directly for development  
- No need for separate dev/staging environments
- No local Docker/Supabase setup - work directly with remote database
- When querying database, use echo and pipe commands (e.g., `echo "SELECT * FROM recipes;" | supabase db query`) instead of creating temporary script files
- IMPORTANT: avoid creating temporary scripts

## claude commands:
/batch_import_workflow: execute instructions in claude/commands/batch_import_workflow.md
/recipes: execute instructions in claude/commands/recipes.md

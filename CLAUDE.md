# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Database Workflow

### Schema Changes
- **All schema changes must use migrations**: `npm run migration:new <name>`
- **Never modify production schema directly**
- **Never edit existing migrations after applied**
- **Test locally first**: `npm run db:reset`
- **Apply to production after PR merge**: `npm run db:push`

### Key Commands
```bash
npm run migration:new    # Create new migration
npm run migration:list   # Check migration status
npm run db:reset        # Reset local DB with all migrations
npm run db:push         # Apply migrations to production
```

## Database Access

```bash
# Database utility for AI development (bypasses RLS)
node scripts/db-utils.js query <query>
# for example
node scripts/db-utils.js query "SELECT * FROM recipes;"
```

## Architecture

### Tech Stack
- **React 18** with Vite - Entry: `index.html` → `src/main.jsx` → `src/App.jsx`
- **React Router DOM** - Client-side routing with protected/public routes
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Backend database service, client in `src/supabaseClient.js`
- **Supabase Auth** - Authentication with email/password and Google OAuth
- **React Query** - Data fetching and caching layer

### Key Notes
- Base path is `/weekmenu/` for GitHub Pages (set in `vite.config.js`)
- Automatic deployment to GitHub Pages on push to main branch
- Supabase credentials are hardcoded in the client (typical for public anon key)
- Hub and Spoke navigation pattern
- **Data Fetching**: All data fetching uses React Query directly with centralized query keys and fetch functions

### Development Notes
- The production Supabase database can be used for development
- The local Docker/Supabase setup is only for running automated tests
- For quick database queries, use: `node scripts/db-utils.js query "SELECT * FROM recipes;"`
- IMPORTANT: avoid creating temporary scripts
- For test navigation use full paths that include `/weekmenu/`
- Tests should be independant of implementation and only depend on requirement intents
- Never create unit tests that mock the db or auth. For automated testing always use the test db and the test user.
- **For fast test feedback**: Use `npm test -- <test-file> -x --reporter=dot` to run tests in parallel and stop on first failure

## Authentication & Authorization

### User Management
- **Users table** - Extends auth.users with profile data and subscription_id
- **Subscriptions table** - Each user gets automatic subscription on signup

### Access Control
- **All subscriptions** have read access to all recipes, recipe_ingredients, and products
- **Future tables** can be subscription-aware by including subscription_id columns
- **RLS policies**
   - tables that have a subscription_id or a FK to a table with a subscription_id are only available for admins or users of that subscription
   - tables that do not have a subscription_id nor a FK to a table with a subscription_id can not be have create, update or delete for non admins

## Database Models & Testing
- **Types**: `npm run types:generate:remote` generates schema types to `types/database.ts` - use in app via `import { Recipe } from '../types/helpers'`
- **Test data**: Use factories from `tests/factories/index.js` (e.g. `RecipeFactory.create()`)

## MCP Tools
- **Context7 MCP**: Use the Context7 MCP server whenever documentation information is required. This provides access to documentation context and reference materials.
- **Playwright MCP**: Use for development testing and debugging:
  - Quick manual testing of UI changes without writing test scripts
  - Debugging user-reported issues by reproducing their actions
  - Verifying deployed features work correctly in production
  - Testing OAuth flows and third-party integrations

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

### Key Notes
- Base path is `/weekmenu/` for GitHub Pages (set in `vite.config.js`)
- Automatic deployment to GitHub Pages on push to main branch
- Supabase credentials are hardcoded in the client (typical for public anon key)

### Development Notes
- The production Supabase database can be used for development and testing
- No local Docker/Supabase setup - work directly with remote database
- For quick database queries, use: `node scripts/db-utils.js query "SELECT * FROM recipes;"`
- IMPORTANT: avoid creating temporary scripts
- For test navigation use full paths that include `/weekmenu/`
- Tests should be independant of implementation and only depend on requirement intents

## Authentication & Authorization

### User Management
- **Users table** - Extends auth.users with profile data and subscription_id
- **Subscriptions table** - Each user gets automatic subscription on signup

### Access Control
- **All subscriptions** have read access to all recipes, recipe_ingredients, and products
- **Future tables** can be subscription-aware by including subscription_id columns
- **RLS policies** secure user-specific data while keeping core content public

## claude commands:
/recipes: execute instructions in claude/commands/recipes.md

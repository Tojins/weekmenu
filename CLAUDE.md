# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
cd scripts && npm run collect  # Populate ingredients from Colruyt (30-60 min)

# Supabase CLI:
npm run db:push          # Push migrations to remote
npm run migration:new    # Create new migration

# Scripts folder:
node extract_colruyt_products.js  # Extract from HTML files
node import_products.js           # Import to Supabase

# Product Import with AI-Generated Descriptions:
node prepare_products_batch.js     # Download 5 product images for analysis
# Analyze images and create batch_results.json with English descriptions
node import_batch_results.js       # Import products with descriptions
node import_products_interactive.js # Alternative: one-by-one interactive import
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

## Product Import Batch Procedure

1. `node scripts/prepare_products_batch.js` - Download product images
2. Analyze images, create `batch_results.json` (follow `scripts/description_guidelines.md`)
3. `node scripts/import_batch_results.js` - Import with English descriptions
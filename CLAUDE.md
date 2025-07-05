# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
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
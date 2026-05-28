# My Space

My Space is a productivity web app built with React + TypeScript + Vite.  
It includes:

- Dashboard overview
- Todo planner (calendar, list, kanban)
- Notes workspace (TipTap rich editor)
- AI formatter and AI content generator
- Supabase auth/data mode with local mock fallback
- Google OAuth, Email/Password auth, guest auth, and password recovery

## Tech Stack

- React 19
- TypeScript
- Vite
- Zustand
- Tailwind CSS
- Supabase
- Vercel (hosting + serverless API routes)

## Prerequisites

- Node.js 20+
- npm

## Installation

```bash
npm install
```

## Environment Setup

Create a `.env.local` file at project root.

### Required for Supabase mode (optional if you want mock mode)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ALLOW_MOCK_AUTH=false
```

If these are missing and `VITE_ALLOW_MOCK_AUTH=true`, app uses local mock auth mode.
For real Supabase auth (recommended), keep `VITE_ALLOW_MOCK_AUTH=false`.

### Required for AI generation

Use server-side keys (do not prefix with `VITE_`):

```env
# Preferred
GEMINI_API_KEY=your_gemini_key

# Optional fallback
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

## Running Locally

```bash
npm run dev
```

The app runs on Vite dev server, and `/api/ai/generate` is handled locally by Vite middleware in development.

## Build and Lint

```bash
npm run lint
npm run build
```

## Production Deployment (Vercel)

This project is ready for Vercel:

- Frontend is served as SPA.
- `api/ai/generate.js` is deployed as a serverless function.
- `vercel.json` rewrites support both API and SPA routing.

### Vercel Environment Variables

Set these in Vercel Project Settings:

- `GEMINI_API_KEY` (recommended), or
- `OPENAI_API_KEY` (+ optional `OPENAI_MODEL`)
- `VITE_SUPABASE_URL` (if using Supabase)
- `VITE_SUPABASE_ANON_KEY` (if using Supabase)

## Supabase Auth Setup Steps

1. Run SQL script: `supabase/auth_setup.sql` in Supabase SQL Editor.
2. In Supabase Authentication settings:
   - Enable Google provider (already working in your setup).
   - Enable Email provider.
   - Enable Anonymous Sign-Ins (for "Continue as Guest").
3. Add redirect URLs:
   - `http://localhost:5173/reset-password`
   - `https://<your-domain>/reset-password`
4. Ensure reset email template uses Supabase default recovery flow.

## Notes

- Do not store provider keys in `VITE_*` variables.
- `VITE_*` values are exposed to the browser.
- Server keys must remain server-side only.

# Website Builder

AI-powered WYSIWYG website builder built with Next.js, GrapesJS, and Claude AI.

## Features
- Visual drag-and-drop editor powered by GrapesJS
- AI chat panel (Claude-powered) for generating and editing pages
- Multi-page support
- Version history with restore
- One-click Vercel deployment
- ZIP export and import
- Responsive preview

## Setup

1. Copy `.env.local.example` to `.env.local` and fill in all values
2. Run `npm install`
3. Run `npm run dev`

## Required Services
- **Neon** (PostgreSQL): DATABASE_URL
- **Clerk** (Auth): NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
- **Anthropic** (AI): ANTHROPIC_API_KEY
- **Vercel** (Deploy): VERCEL_TOKEN, VERCEL_TEAM_ID (optional)
- **Vercel Blob** (Storage): BLOB_READ_WRITE_TOKEN

## Database Setup
Run the schema from `src/lib/db/schema.ts` against your Neon database.

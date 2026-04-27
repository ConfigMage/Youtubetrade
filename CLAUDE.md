# Video Trade — Session Context

## What is this?
A family web app for sharing YouTube video recommendations using a trading-card metaphor. Members curate showcases of videos, suggest them to each other ("trades"), mark them watched, and leave emoji reactions.

## Tech Stack
- Next.js 14+ (App Router) + Tailwind CSS
- Neon (serverless Postgres) + Drizzle ORM
- Resend for email notifications
- YouTube Data API v3 for video metadata
- Deployed on Vercel

## Key Architecture Decisions
- **No authentication**: Family member selected via dropdown, stored in localStorage
- **~5 family members**: Managed via admin page, not hardcoded
- **Honor system**: Watching is self-reported, no verification
- **Trade = Suggestion**: The "trade" framing is thematic — it's really a suggestion/recommendation system
- **YouTube embed + external link**: Embedded player in card detail modal, with escape hatch to YouTube

## Database
- Neon serverless Postgres via `@neondatabase/serverless`
- Drizzle ORM for schema and queries
- Tables: family_members, video_cards, trade_offers, watch_reactions

## Pages
- `/` — Home: showcase carousel rows per family member
- `/showcase` — Current user's card grid + add/edit/suggest
- `/showcase/[memberId]` — Other member's showcase (read-only + react)
- `/trades` — Incoming/outgoing suggestion tabs
- `/admin` — Manage family members (admin only)

## Design Direction
- **Trading card aesthetic**: Cards with subtle border/frame, shadow, rounded corners — collectible feel
- **Warm color palette**: Cozy family game night vibe
- **Mobile-first**: Thumb-friendly, swipeable carousels
- **Duration badge**: "2:34" or "1:02:15" overlay on thumbnail
- **Tag chips**: Small, colorful, rounded — consistent color per tag

## Current Status
- [x] Project scaffolded
- [x] Dependencies installed
- [ ] Database schema migrated (run `npm run db:push` once DATABASE_URL is set)
- [ ] Family members seeded (run `npm run db:seed` once DATABASE_URL is set)
- [x] YouTube metadata API route
- [x] Card CRUD
- [x] Showcase pages
- [x] Home page carousel
- [x] Card Detail Modal + embedded player + reactions
- [x] Trade/suggestion flow + Resend email
- [x] Member showcase browse + nav tabs
- [x] Admin page
- [x] Mobile responsive polish
- [ ] Deploy to Vercel

## Setup checklist (for the human running this locally)
1. Edit `.env.local` and fill in:
   - `DATABASE_URL` — Neon connection string (https://neon.tech)
   - `YOUTUBE_API_KEY` — Google Cloud Console → enable YouTube Data API v3
   - `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — https://resend.com (optional)
2. `npm run db:push` — creates the four tables
3. Edit `src/db/seed.ts` with real family member emails, then `npm run db:seed`
4. `npm run dev` — open http://localhost:3000

If `YOUTUBE_API_KEY` is empty, the metadata route still works in a degraded
mode (derived thumbnail, "Untitled video" placeholder).
If `RESEND_API_KEY` is empty, trades still create — only the email is skipped.

## V2 Ideas (not in scope)
- Watch party mode (group video + reaction thread)
- Leaderboard / stats
- Mystery trade (blind category-only trade)
- Weekly digest email
- "Already watched" flag
- Video length fairness meter on trades

# Not So Blind

A web app for setting friends up on blind dates, endorsed by the crowd.

## MVP Features

### Core Flow
1. **Nominate two friends** - Add their names and phone numbers with a rationale
2. **Get endorsements** - Share a link for friends to sanity-check (binary 👍/👎)
3. **Threshold unlock** - When ≥3 positive endorsements + <25% negative, chat unlocks
4. **Private chat** - Nominated people get notified and can chat in-app
5. **One nomination at a time** - Users can only have one active nomination

### Design Philosophy
- **Warm darkness** - Deep charcoal plum backgrounds with amber accents
- **Glass panels** - Translucent UI with backdrop blur
- **Mystery & intimacy** - No photos, no profiles, text-only
- **Zero pressure** - No read receipts, no "seen" status

## Tech Stack

- **Next.js 15** (App Router + TypeScript)
- **Tailwind CSS** (custom design system)
- **Supabase** (Postgres + Realtime)
- **Twilio Verify** (SMS authentication)
- **Railway** (deployment + PR previews)

## Setup

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Twilio account with Verify service
- Railway account (optional, for deployment)

### Local Development

1. **Clone and install dependencies**

```bash
git clone <repo-url>
cd NotSoBlind
npm install
```

2. **Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (http://localhost:3000 locally)
- `ADMIN_PASSWORD` (set your own)

3. **Run database migrations**

Go to Supabase Dashboard → SQL Editor, and run:

```bash
supabase/migrations/20260104000000_initial_schema.sql
```

See `supabase/README.md` for details.

4. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── page.tsx              # Landing page
├── nominate/page.tsx     # Create nomination flow
├── endorse/[token]/      # Endorsement page (shareable link)
├── chat/[id]/            # Chat interface (unlocked nominations)
├── admin/page.tsx        # Admin dashboard
└── api/
    ├── auth/             # Phone verification endpoints
    ├── nominations/      # Nomination CRUD
    ├── endorsements/     # Endorsement creation
    ├── chat/             # Chat messages
    └── admin/            # Admin endpoints

components/
└── AuthModal.tsx         # Phone verification modal

lib/
├── supabase.ts          # Supabase client + types
├── twilio.ts            # Twilio Verify helpers
├── session.ts           # Cookie-based sessions
└── db/
    ├── users.ts         # User operations
    ├── nominations.ts   # Nomination operations
    ├── endorsements.ts  # Endorsement operations
    └── messages.ts      # Chat message operations

supabase/
└── migrations/          # SQL schema files
```

## Database Schema

### Tables

- **users** - Verified users (phone + first_name)
- **nominations** - Blind date nominations
- **endorsements** - Binary endorsements (👍/👎)
- **messages** - Chat messages (Realtime)

### Key Features

- **Normalized pair keys** - Prevents duplicate nominations (A+B = B+A)
- **Auto-unlock trigger** - Automatically unlocks when threshold is met
- **RLS enabled** - Row-level security on all tables
- **Realtime subscriptions** - Live chat updates via Supabase

## Deployment

### Railway

See `RAILWAY_SETUP.md` for detailed instructions.

**Quick setup:**

1. Connect Railway to your GitHub repo
2. Set environment variables in Railway dashboard
3. Enable PR preview deployments
4. Push to main branch to deploy
5. Set the Railway health check path to `/api/health` (Project → Settings → Deployments → Health Checks) so deployments fail fast if required environment variables are missing or the database is unreachable. The included `railway.toml` sets this path by default—confirm it is applied in your service settings.

### Health check endpoint

- `GET /api/health` validates required environment variables (Supabase, Twilio, admin password, and public URLs) **before** creating any clients, then probes database connectivity.
- Returns `200` when everything is configured; returns `500` with a list of missing variables or database errors to guide fixes during deployment.

## Admin Dashboard

Access at `/admin` with the password set in `ADMIN_PASSWORD` env var.

**Features:**
- View all nominations
- See endorsement counts (👍/👎)
- Monitor nomination status
- View share links

## API Endpoints

### Auth
- `POST /api/auth/send-code` - Send verification SMS
- `POST /api/auth/verify-code` - Verify code + create session
- `GET /api/auth/me` - Get current session
- `POST /api/auth/logout` - Destroy session

### Nominations
- `POST /api/nominations/create` - Create nomination (auth required)
- `GET /api/nominations/[token]` - Get nomination by share token

### Endorsements
- `POST /api/endorsements/create` - Create endorsement (auth required)

### Chat
- `GET /api/chat/[id]` - Get chat data (auth required, participants only)
- `POST /api/chat/send` - Send message (auth required, participants only)

### Admin
- `GET /api/admin/nominations` - Get all nominations (password protected)

## Design System

### Colors

- **Deep Charcoal Plum** (`#1E1A22`) - Background
- **Smoked Rosewood** (`#6B3A3A`) - Primary CTA
- **Candle Amber** (`#E1B382`) - Highlights
- **Moonstone Gray** (`#C8C6CC`) - Text

### Components

```css
.glass-panel        /* Translucent panel with backdrop blur */
.btn-primary        /* Rosewood button with amber glow on hover */
.btn-secondary      /* Transparent amber border button */
.input-field        /* Glass input with amber focus ring */
```

## MVP Constraints

✅ **Included:**
- Phone verification (US only)
- Binary endorsements
- Real-time chat
- Share links
- Admin dashboard

❌ **Not Included:**
- Photos or profiles
- Preferences/filters
- Swipe mechanics
- Push notifications (SMS only)
- Analytics dashboard
- Outcome tracking (basic version only)

## Future Enhancements

- [ ] Outcome feedback prompts (7-day follow-up)
- [ ] "Exchange numbers?" prompt after chat activity
- [ ] Analytics dashboard
- [ ] International phone support
- [ ] Push notifications
- [ ] "Mutuals" calculation based on in-app graph

## License

Private MVP - All rights reserved

## Contact

For questions or issues, contact the dev team.

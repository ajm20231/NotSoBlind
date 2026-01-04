# Supabase Database Setup

## Running Migrations

### Option 1: Via Supabase Dashboard (Recommended for MVP)

1. Go to https://supabase.com/dashboard
2. Select your project: `rmzdoniqgrvfvzeocjbk`
3. Navigate to SQL Editor
4. Copy the contents of `migrations/20260104000000_initial_schema.sql`
5. Paste and run the migration

### Option 2: Via Supabase CLI (for later)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref rmzdoniqgrvfvzeocjbk

# Run migrations
supabase db push
```

## Database Schema

### Tables

- **users**: Verified users (phone + first_name)
- **nominations**: Blind date nominations
- **endorsements**: Binary endorsements (👍/👎)
- **messages**: Chat messages after unlock

### Key Features

- **Normalized pair keys**: Prevents duplicate nominations (A+B = B+A)
- **Auto-unlock trigger**: Automatically unlocks when threshold is met (≥3 👍, <25% 👎)
- **Share tokens**: Unique tokens for endorsement links
- **RLS enabled**: Row-level security for data protection

## Testing the Schema

After running the migration, test with:

```sql
-- Insert a test user
INSERT INTO users (phone, first_name) VALUES ('+12025551234', 'Alice');

-- Check it worked
SELECT * FROM users;
```

import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (uses anon key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-side Supabase client (uses service role key for admin operations)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database types
export interface User {
  id: string;
  phone: string;
  first_name: string;
  is_banned: boolean;
  created_at: string;
}

export interface Nomination {
  id: string;
  nominator_id: string;
  person_a_phone: string;
  person_a_name: string;
  person_b_phone: string;
  person_b_name: string;
  rationale: string;
  status: 'pending' | 'unlocked' | 'expired' | 'completed';
  pair_key: string;
  share_token: string;
  created_at: string;
  unlocked_at: string | null;
  expires_at: string;
  outcome: 'talked' | 'dated' | 'nothing' | null;
  outcome_submitted_at: string | null;
}

export interface Endorsement {
  id: string;
  nomination_id: string;
  endorser_phone: string;
  is_positive: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  nomination_id: string;
  sender_phone: string;
  content: string;
  created_at: string;
}

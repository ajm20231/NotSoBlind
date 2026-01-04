import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnvVar } from './env';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = requireEnvVar('NEXT_PUBLIC_SUPABASE_URL', {
    description: 'Supabase project URL',
  });
  const supabaseAnonKey = requireEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', {
    description: 'Supabase anon public API key',
  });

  return createClient(supabaseUrl, supabaseAnonKey);
}

function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = requireEnvVar('NEXT_PUBLIC_SUPABASE_URL', {
    description: 'Supabase project URL',
  });
  const supabaseServiceKey = requireEnvVar('SUPABASE_SERVICE_ROLE_KEY', {
    description: 'Supabase service role key (keep this secret)',
  });

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }

  return supabaseClient;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createSupabaseAdminClient();
  }

  return supabaseAdminClient;
}

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

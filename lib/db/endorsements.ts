import { getSupabaseClient, type Endorsement } from '@/lib/supabase';
import { formatPhoneNumber } from '@/lib/utils';

/**
 * Create an endorsement
 */
export async function createEndorsement(
  nominationId: string,
  endorserPhone: string,
  isPositive: boolean
): Promise<Endorsement | null> {
  try {
    const supabase = getSupabaseClient();
    const formattedPhone = formatPhoneNumber(endorserPhone);

    // Check if already endorsed
    const { data: existing } = await supabase
      .from('endorsements')
      .select('*')
      .eq('nomination_id', nominationId)
      .eq('endorser_phone', formattedPhone)
      .single();

    if (existing) {
      throw new Error('You have already endorsed this nomination');
    }

    // Create endorsement
    const { data, error } = await supabase
      .from('endorsements')
      .insert({
        nomination_id: nominationId,
        endorser_phone: formattedPhone,
        is_positive: isPositive,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating endorsement:', error);
      return null;
    }

    return data as Endorsement;
  } catch (error) {
    console.error('Error in createEndorsement:', error);
    return null;
  }
}

/**
 * Check if user has already endorsed a nomination
 */
export async function hasEndorsed(nominationId: string, endorserPhone: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const formattedPhone = formatPhoneNumber(endorserPhone);

    const { data } = await supabase
      .from('endorsements')
      .select('id')
      .eq('nomination_id', nominationId)
      .eq('endorser_phone', formattedPhone)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get all endorsements for a nomination
 */
export async function getEndorsements(nominationId: string): Promise<Endorsement[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('endorsements')
      .select('*')
      .eq('nomination_id', nominationId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return data as Endorsement[];
  } catch (error) {
    return [];
  }
}

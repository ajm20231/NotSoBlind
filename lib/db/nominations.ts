import { supabase, supabaseAdmin, Nomination } from '@/lib/supabase';
import { formatPhoneNumber } from '@/lib/utils';

/**
 * Normalize pair key (consistent ordering)
 */
export function normalizePairKey(phoneA: string, phoneB: string): string {
  return phoneA < phoneB ? `${phoneA}-${phoneB}` : `${phoneB}-${phoneA}`;
}

/**
 * Generate unique share token
 */
function generateShareToken(): string {
  return Math.random().toString(36).substring(2, 14);
}

/**
 * Create a new nomination
 */
export async function createNomination(params: {
  nominatorId: string;
  personAPhone: string;
  personAName: string;
  personBPhone: string;
  personBName: string;
  rationale: string;
}): Promise<Nomination | null> {
  try {
    const { nominatorId, personAPhone, personAName, personBPhone, personBName, rationale } = params;

    // Format phone numbers
    const formattedA = formatPhoneNumber(personAPhone);
    const formattedB = formatPhoneNumber(personBPhone);

    // Generate pair key
    const pairKey = normalizePairKey(formattedA, formattedB);

    // Check for existing nomination with same pair
    const { data: existing } = await supabase
      .from('nominations')
      .select('*')
      .eq('pair_key', pairKey)
      .in('status', ['pending', 'unlocked'])
      .single();

    if (existing) {
      // For MVP, we'll just return the existing nomination
      // TODO: In future, merge nominators
      return existing as Nomination;
    }

    // Check if nominator has an active nomination
    const { data: activeNomination } = await supabase
      .from('nominations')
      .select('*')
      .eq('nominator_id', nominatorId)
      .in('status', ['pending', 'unlocked'])
      .single();

    if (activeNomination) {
      throw new Error('You already have an active nomination. Wait for it to complete or expire.');
    }

    // Create nomination
    const { data, error } = await supabase
      .from('nominations')
      .insert({
        nominator_id: nominatorId,
        person_a_phone: formattedA,
        person_a_name: personAName,
        person_b_phone: formattedB,
        person_b_name: personBName,
        rationale,
        pair_key: pairKey,
        share_token: generateShareToken(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating nomination:', error);
      return null;
    }

    return data as Nomination;
  } catch (error) {
    console.error('Error in createNomination:', error);
    return null;
  }
}

/**
 * Get nomination by share token
 */
export async function getNominationByToken(token: string): Promise<Nomination | null> {
  try {
    const { data, error } = await supabase
      .from('nominations')
      .select('*')
      .eq('share_token', token)
      .single();

    if (error) return null;
    return data as Nomination;
  } catch (error) {
    return null;
  }
}

/**
 * Get nomination by ID
 */
export async function getNominationById(id: string): Promise<Nomination | null> {
  try {
    const { data, error } = await supabase
      .from('nominations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Nomination;
  } catch (error) {
    return null;
  }
}

/**
 * Get endorsement counts for a nomination
 */
export async function getEndorsementCounts(nominationId: string): Promise<{
  positive: number;
  negative: number;
  meetsThreshold: boolean;
}> {
  try {
    const { data: endorsements } = await supabase
      .from('endorsements')
      .select('is_positive')
      .eq('nomination_id', nominationId);

    if (!endorsements) {
      return { positive: 0, negative: 0, meetsThreshold: false };
    }

    const positive = endorsements.filter((e) => e.is_positive).length;
    const negative = endorsements.filter((e) => !e.is_positive).length;
    const total = positive + negative;

    // Threshold: ≥3 positive AND negative share < 25%
    const negativeRatio = total > 0 ? negative / total : 0;
    const meetsThreshold = positive >= 3 && negativeRatio < 0.25;

    return { positive, negative, meetsThreshold };
  } catch (error) {
    console.error('Error getting endorsement counts:', error);
    return { positive: 0, negative: 0, meetsThreshold: false };
  }
}

/**
 * Submit outcome feedback
 */
export async function submitOutcome(
  nominationId: string,
  outcome: 'talked' | 'dated' | 'nothing'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('nominations')
      .update({
        outcome,
        outcome_submitted_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', nominationId);

    return !error;
  } catch (error) {
    console.error('Error submitting outcome:', error);
    return false;
  }
}

/**
 * Get all nominations (admin only)
 */
export async function getAllNominations(): Promise<Nomination[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('nominations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data as Nomination[];
  } catch (error) {
    return [];
  }
}

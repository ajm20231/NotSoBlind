import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check admin password
    const password = request.headers.get('X-Admin-Password');

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all nominations with endorsement counts
    const { data: nominations, error } = await supabaseAdmin
      .from('nominations')
      .select(
        `
        *,
        endorsements (
          is_positive
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching nominations:', error);
      return NextResponse.json({ error: 'Failed to fetch nominations' }, { status: 500 });
    }

    // Process endorsement counts
    const processedNominations = nominations.map((nom: any) => {
      const endorsements = nom.endorsements || [];
      const positive_count = endorsements.filter((e: any) => e.is_positive).length;
      const negative_count = endorsements.filter((e: any) => !e.is_positive).length;

      return {
        id: nom.id,
        person_a_name: nom.person_a_name,
        person_b_name: nom.person_b_name,
        rationale: nom.rationale,
        status: nom.status,
        created_at: nom.created_at,
        share_token: nom.share_token,
        positive_count,
        negative_count,
      };
    });

    return NextResponse.json({ nominations: processedNominations });
  } catch (error) {
    console.error('Error in admin nominations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

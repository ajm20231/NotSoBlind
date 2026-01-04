import { NextRequest, NextResponse } from 'next/server';
import { getNominationByToken, getEndorsementCounts } from '@/lib/db/nominations';
import { hasEndorsed } from '@/lib/db/endorsements';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const nomination = await getNominationByToken(token);

    if (!nomination) {
      return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
    }

    // Get endorsement counts
    const counts = await getEndorsementCounts(nomination.id);

    // Check if current user has endorsed (if authenticated)
    let userHasEndorsed = false;
    const session = await getSession();
    if (session) {
      userHasEndorsed = await hasEndorsed(nomination.id, session.phone);
    }

    return NextResponse.json({
      nomination: {
        id: nomination.id,
        person_a_name: nomination.person_a_name,
        person_b_name: nomination.person_b_name,
        rationale: nomination.rationale,
        status: nomination.status,
        created_at: nomination.created_at,
      },
      counts: {
        positive: counts.positive,
      },
      hasEndorsed: userHasEndorsed,
    });
  } catch (error) {
    console.error('Error getting nomination:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

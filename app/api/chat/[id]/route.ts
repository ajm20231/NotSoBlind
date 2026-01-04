import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { getNominationById } from '@/lib/db/nominations';
import { getMessages } from '@/lib/db/messages';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const nomination = await getNominationById(id);

    if (!nomination) {
      return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
    }

    // Check if user is a participant
    if (
      session.phone !== nomination.person_a_phone &&
      session.phone !== nomination.person_b_phone
    ) {
      return NextResponse.json(
        { error: 'You are not a participant in this chat' },
        { status: 403 }
      );
    }

    // Check if nomination is unlocked
    if (nomination.status !== 'unlocked') {
      return NextResponse.json({ error: 'This chat is not unlocked yet' }, { status: 400 });
    }

    // Get messages
    const messages = await getMessages(id);

    return NextResponse.json({
      nomination: {
        id: nomination.id,
        person_a_phone: nomination.person_a_phone,
        person_a_name: nomination.person_a_name,
        person_b_phone: nomination.person_b_phone,
        person_b_name: nomination.person_b_name,
        rationale: nomination.rationale,
      },
      messages,
    });
  } catch (error: any) {
    console.error('Error getting chat:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

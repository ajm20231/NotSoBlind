import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { createNomination } from '@/lib/db/nominations';
import { formatPhoneNumber, isValidUSPhone } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { personAPhone, personAName, personBPhone, personBName, rationale } =
      await request.json();

    // Validate inputs
    if (!personAPhone || !personAName || !personBPhone || !personBName || !rationale) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (rationale.trim().length < 10) {
      return NextResponse.json(
        { error: 'Rationale must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Format and validate phones
    const formattedA = formatPhoneNumber(personAPhone);
    const formattedB = formatPhoneNumber(personBPhone);

    if (!isValidUSPhone(formattedA) || !isValidUSPhone(formattedB)) {
      return NextResponse.json({ error: 'Invalid phone numbers' }, { status: 400 });
    }

    // Check for self-nomination
    if (
      formattedA === session.phone ||
      formattedB === session.phone ||
      formattedA === formattedB
    ) {
      return NextResponse.json(
        { error: 'Cannot nominate yourself or the same person twice' },
        { status: 400 }
      );
    }

    // Create nomination
    const nomination = await createNomination({
      nominatorId: session.userId,
      personAPhone: formattedA,
      personAName: personAName.trim(),
      personBPhone: formattedB,
      personBName: personBName.trim(),
      rationale: rationale.trim(),
    });

    if (!nomination) {
      return NextResponse.json(
        { error: 'Failed to create nomination. You may already have an active nomination.' },
        { status: 400 }
      );
    }

    // Generate share link
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/endorse/${nomination.share_token}`;

    return NextResponse.json({
      success: true,
      nomination: {
        id: nomination.id,
        shareToken: nomination.share_token,
        shareUrl,
      },
    });
  } catch (error: any) {
    console.error('Error creating nomination:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

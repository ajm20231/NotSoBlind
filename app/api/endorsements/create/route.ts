import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { createEndorsement } from '@/lib/db/endorsements';
import { getNominationById } from '@/lib/db/nominations';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { nominationId, isPositive } = await request.json();

    if (!nominationId || typeof isPositive !== 'boolean') {
      return NextResponse.json(
        { error: 'Nomination ID and endorsement type are required' },
        { status: 400 }
      );
    }

    // Check if nomination exists and is still pending
    const nomination = await getNominationById(nominationId);

    if (!nomination) {
      return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
    }

    if (nomination.status !== 'pending') {
      return NextResponse.json(
        { error: 'This nomination is no longer accepting endorsements' },
        { status: 400 }
      );
    }

    // Create endorsement
    const endorsement = await createEndorsement(nominationId, session.phone, isPositive);

    if (!endorsement) {
      return NextResponse.json(
        { error: 'Failed to create endorsement. You may have already endorsed this nomination.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      endorsement: {
        id: endorsement.id,
        isPositive: endorsement.is_positive,
      },
    });
  } catch (error: any) {
    console.error('Error creating endorsement:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

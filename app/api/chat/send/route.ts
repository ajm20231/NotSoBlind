import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { sendMessage } from '@/lib/db/messages';
import { getNominationById } from '@/lib/db/nominations';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { nominationId, content } = await request.json();

    if (!nominationId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nomination ID and message content are required' },
        { status: 400 }
      );
    }

    // Check if nomination exists and is unlocked
    const nomination = await getNominationById(nominationId);

    if (!nomination) {
      return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
    }

    if (nomination.status !== 'unlocked') {
      return NextResponse.json(
        { error: 'This chat is not unlocked yet' },
        { status: 400 }
      );
    }

    // Check if sender is one of the nominated people
    if (
      session.phone !== nomination.person_a_phone &&
      session.phone !== nomination.person_b_phone
    ) {
      return NextResponse.json(
        { error: 'You are not a participant in this chat' },
        { status: 403 }
      );
    }

    // Send message
    const message = await sendMessage(nominationId, session.phone, content.trim());

    if (!message) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderPhone: message.sender_phone,
        createdAt: message.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error sending message:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyCode, formatPhoneNumber } from '@/lib/twilio';
import { getOrCreateUser, isUserBanned } from '@/lib/db/users';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { phone, code, firstName } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone and code are required' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Check if user is banned
    const banned = await isUserBanned(formattedPhone);
    if (banned) {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }

    // Verify code with Twilio
    const verified = await verifyCode(formattedPhone, code);

    if (!verified) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Get or create user
    const user = await getOrCreateUser(formattedPhone, firstName || 'User');

    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create session
    await createSession({
      phone: user.phone,
      firstName: user.first_name,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.first_name,
      },
    });
  } catch (error) {
    console.error('Error in verify-code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

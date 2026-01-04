import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationCode, formatPhoneNumber, isValidUSPhone } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Format and validate phone
    const formattedPhone = formatPhoneNumber(phone);

    if (!isValidUSPhone(formattedPhone)) {
      return NextResponse.json({ error: 'Invalid US phone number' }, { status: 400 });
    }

    // Send verification code via Twilio
    const success = await sendVerificationCode(formattedPhone);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send verification code' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, phone: formattedPhone });
  } catch (error) {
    console.error('Error in send-code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

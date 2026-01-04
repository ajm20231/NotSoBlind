import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID!;

const client = twilio(accountSid, authToken);

/**
 * Send verification code to phone number
 */
export async function sendVerificationCode(phoneNumber: string): Promise<boolean> {
  try {
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms',
      });

    return verification.status === 'pending';
  } catch (error) {
    console.error('Error sending verification code:', error);
    return false;
  }
}

/**
 * Verify code sent to phone number
 */
export async function verifyCode(phoneNumber: string, code: string): Promise<boolean> {
  try {
    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({
        to: phoneNumber,
        code: code,
      });

    return verificationCheck.status === 'approved';
  } catch (error) {
    console.error('Error verifying code:', error);
    return false;
  }
}

/**
 * Send SMS notification (for unlocked nominations)
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    await client.messages.create({
      body: message,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER || '+12025551234', // You'll need to set this
    });

    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

/**
 * Format phone number to E.164 (+1XXXXXXXXXX)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If it starts with 1 and has 11 digits, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return '+' + digits;
  }

  // If it has 10 digits, add +1
  if (digits.length === 10) {
    return '+1' + digits;
  }

  // If it already has +1, return as is
  if (phone.startsWith('+1')) {
    return phone;
  }

  // Otherwise, assume US and add +1
  return '+1' + digits;
}

/**
 * Validate US phone number
 */
export function isValidUSPhone(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // US phone numbers are +1 followed by 10 digits
  return /^\+1\d{10}$/.test(formatted);
}

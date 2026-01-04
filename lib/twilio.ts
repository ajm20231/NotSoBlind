import twilio, { type Twilio } from 'twilio';
import { getEnvVar } from './env';

type TwilioConfig = {
  accountSid: string;
  authToken: string;
  verifySid: string;
  fromNumber: string;
};

let client: Twilio | null = null;
let config: TwilioConfig | null = null;

function loadTwilioConfig(): TwilioConfig {
  if (config) return config;

  const accountSid = getEnvVar('TWILIO_ACCOUNT_SID', {
    optional: true,
    description: 'Twilio Account SID',
  });
  const authToken = getEnvVar('TWILIO_AUTH_TOKEN', {
    optional: true,
    description: 'Twilio Auth Token',
  });
  const verifySid = getEnvVar('TWILIO_VERIFY_SERVICE_SID', {
    optional: true,
    description: 'Twilio Verify Service SID',
  });
  const fromNumber =
    getEnvVar('TWILIO_PHONE_NUMBER', {
      fallback: '+12025551234',
      description: 'Twilio sender number',
    }) || '+12025551234';

  if (!accountSid || !authToken || !verifySid) {
    throw new Error(
      'Twilio credentials are missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID).'
    );
  }

  config = {
    accountSid,
    authToken,
    verifySid,
    fromNumber,
  };

  return config;
}

function getTwilioClient(): { client: Twilio; config: TwilioConfig } | null {
  try {
    const resolvedConfig = loadTwilioConfig();

    if (!client) {
      client = twilio(resolvedConfig.accountSid, resolvedConfig.authToken);
    }

    return { client, config: resolvedConfig };
  } catch (error) {
    console.error(
      '[twilio] Twilio configuration error:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Send verification code to phone number
 */
export async function sendVerificationCode(phoneNumber: string): Promise<boolean> {
  try {
    const twilioClient = getTwilioClient();

    if (!twilioClient) return false;

    const verification = await twilioClient.client.verify.v2
      .services(twilioClient.config.verifySid)
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
    const twilioClient = getTwilioClient();

    if (!twilioClient) return false;

    const verificationCheck = await twilioClient.client.verify.v2
      .services(twilioClient.config.verifySid)
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
    const twilioClient = getTwilioClient();

    if (!twilioClient) return false;

    await twilioClient.client.messages.create({
      body: message,
      to: to,
      from: twilioClient.config.fromNumber,
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

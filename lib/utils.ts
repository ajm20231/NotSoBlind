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

/**
 * Normalizes incoming Nigerian phone numbers from various formats:
 * - "08031234567" -> "08031234567"
 * - "+2348031234567" -> "08031234567"
 * - "2348031234567" -> "08031234567"
 * - "8031234567" -> "08031234567"
 * 
 * Returns canonical 11-digit local number (e.g. 08031234567) or formatted international number if specified.
 */
export const normalizeNigerianPhoneNumber = (input: string, format: 'LOCAL' | 'INTERNATIONAL' = 'LOCAL'): string => {
  if (!input) throw new Error('Phone number input cannot be empty.');

  // Remove spaces, hyphens, and leading plus sign
  let digits = input.trim().replace(/\s+|-|\+/g, '');

  // Handle +234 / 234 prefix
  if (digits.startsWith('234')) {
    digits = '0' + digits.substring(3);
  } else if (!digits.startsWith('0') && digits.length === 10) {
    digits = '0' + digits;
  }

  // Validate Nigerian 11-digit length constraint
  if (!/^0[789][01]\d{8}$/.test(digits)) {
    throw new Error(`Invalid Nigerian phone number format: '${input}'`);
  }

  if (format === 'INTERNATIONAL') {
    return '+234' + digits.substring(1);
  }

  return digits;
};

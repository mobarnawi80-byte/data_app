export type SupportedNetwork = 'MTN' | 'AIRTEL' | 'GLO' | 'NINE_MOBILE';

const PREFIX_MAP: Record<string, SupportedNetwork> = {
  // MTN
  '0803': 'MTN', '0806': 'MTN', '0703': 'MTN', '0706': 'MTN',
  '0813': 'MTN', '0816': 'MTN', '0810': 'MTN', '0814': 'MTN',
  '0903': 'MTN', '0906': 'MTN', '0913': 'MTN', '0916': 'MTN',
  
  // Airtel
  '0802': 'AIRTEL', '0808': 'AIRTEL', '0708': 'AIRTEL', '0812': 'AIRTEL',
  '0701': 'AIRTEL', '0902': 'AIRTEL', '0901': 'AIRTEL', '0904': 'AIRTEL',
  '0907': 'AIRTEL', '0912': 'AIRTEL',

  // Glo
  '0805': 'GLO', '0807': 'GLO', '0705': 'GLO', '0815': 'GLO',
  '0811': 'GLO', '0905': 'GLO', '0915': 'GLO',

  // 9Mobile
  '0809': 'NINE_MOBILE', '0818': 'NINE_MOBILE', '0817': 'NINE_MOBILE',
  '0909': 'NINE_MOBILE', '0908': 'NINE_MOBILE',
};

/**
 * Detect Nigerian Network Operator from phone number prefix
 */
export const detectNetworkFromPhone = (phoneNumber: string): SupportedNetwork | null => {
  if (!phoneNumber) return null;
  
  // Clean string: remove spaces, dashes, +234
  let cleaned = phoneNumber.replace(/\s+|-|\+/g, '');
  if (cleaned.startsWith('234')) {
    cleaned = '0' + cleaned.substring(3);
  }

  if (cleaned.length >= 4) {
    const prefix = cleaned.substring(0, 4);
    return PREFIX_MAP[prefix] || null;
  }

  return null;
};

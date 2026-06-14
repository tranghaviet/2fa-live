const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const DEFAULT_PERIOD_SECONDS = 30;
const DEFAULT_DIGITS = 6;

export class TotpSecretError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TotpSecretError';
  }
}

export function normalizeSecret(secret: string) {
  return secret.replace(/[\s-]/g, '').replace(/=+$/g, '').toUpperCase();
}

export function parseTotpInput(input: string) {
  const trimmedInput = input.trim();

  if (!trimmedInput.toLowerCase().startsWith('otpauth://')) {
    return {
      secret: trimmedInput,
      periodSeconds: DEFAULT_PERIOD_SECONDS,
    };
  }

  let url: URL;
  try {
    url = new URL(trimmedInput);
  } catch {
    throw new TotpSecretError('Invalid otpauth URL.');
  }

  if (url.protocol !== 'otpauth:' || url.hostname.toLowerCase() !== 'totp') {
    throw new TotpSecretError('Only otpauth TOTP URLs are supported.');
  }

  const secret = url.searchParams.get('secret') ?? '';
  const periodParam = url.searchParams.get('period');
  const periodSeconds = periodParam ? Number(periodParam) : DEFAULT_PERIOD_SECONDS;

  if (!Number.isInteger(periodSeconds) || periodSeconds <= 0) {
    throw new TotpSecretError('Period must be a positive number of seconds.');
  }

  return {
    secret,
    periodSeconds,
  };
}

export function secondsUntilNextCode(now = Date.now(), periodSeconds = DEFAULT_PERIOD_SECONDS) {
  const elapsed = Math.floor(now / 1000) % periodSeconds;
  return periodSeconds - elapsed;
}

export async function generateTotp(
  secret: string,
  now = Date.now(),
  periodSeconds = DEFAULT_PERIOD_SECONDS,
  digits = DEFAULT_DIGITS,
) {
  const key = decodeBase32(secret);
  const counter = Math.floor(Math.floor(now / 1000) / periodSeconds);
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setUint32(4, counter, false);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const hash = new Uint8Array(signature);
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  const otp = binary % 10 ** digits;

  return otp.toString().padStart(digits, '0');
}

export function decodeBase32(secret: string) {
  const normalized = normalizeSecret(secret);

  if (!normalized) {
    throw new TotpSecretError('Enter a Base32 secret to generate a code.');
  }

  let bits = '';
  for (const char of normalized) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) {
      throw new TotpSecretError('Secret contains characters outside Base32.');
    }
    bits += value.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }

  if (bytes.length === 0) {
    throw new TotpSecretError('Secret is too short to generate a code.');
  }

  return new Uint8Array(bytes);
}

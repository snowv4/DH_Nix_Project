// SHA-256 of the GM PIN, so the PIN itself is not readable in the public repo.
// This only keeps players honest; anyone with devtools can still bypass a client-side check.
const GM_PIN_SHA256 = '79f06f8fde333461739f220090a23cb2a79f6d714bee100d0e4b4af249294619';

export async function isGmPin(pin: string): Promise<boolean> {
  const bytes = new TextEncoder().encode(pin.trim());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return hex === GM_PIN_SHA256;
}

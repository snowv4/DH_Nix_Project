// PINs are stored as SHA-256 hashes so they aren't readable in the repo or the database.
// This only keeps players honest; anyone with devtools can still bypass a client-side check.
const GM_PIN_SHA256 = '79f06f8fde333461739f220090a23cb2a79f6d714bee100d0e4b4af249294619';

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function isGmPin(pin: string): Promise<boolean> {
  return (await sha256Hex(pin.trim())) === GM_PIN_SHA256;
}

/** Per-sheet PIN hash, salted with the character id so equal PINs don't share a hash. */
export function sheetPinHash(characterId: string, pin: string): Promise<string> {
  return sha256Hex(`${characterId}:${pin.trim()}`);
}

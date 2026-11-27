// Windows-1252, the game's code page: keyboard characters (game-host.mjs) and the lobby's names and
// passwords (index.html, native-worker.mjs) reach the game in it. server/relay/rooms.go has the same table.
const HIGH = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ';
const UNDEFINED = new Set([0x81, 0x8d, 0x8f, 0x90, 0x9d]);

// The Windows-1252 byte of one character, or 0 when it has none (control characters included).
export function cp1252Byte(char) {
  if ([...char].length !== 1) return 0;
  const c = char.codePointAt(0);
  if (c >= 32 && c < 128 || c >= 160 && c < 256) return c;
  const i = HIGH.indexOf(char);
  return i >= 0 && !UNDEFINED.has(0x80 + i) ? 0x80 + i : 0;
}

// Text as Windows-1252 bytes, or null when a character has no byte.
export function encodeCP1252(text) {
  const out = [];
  for (const char of text) {
    const b = cp1252Byte(char);
    if (!b) return null;
    out.push(b);
  }
  return Uint8Array.from(out);
}

// Characters of text that Windows-1252 can't write, for an error message.
export function unsupportedCharacters(text) {
  return [...new Set([...text].filter(char => !cp1252Byte(char)))];
}

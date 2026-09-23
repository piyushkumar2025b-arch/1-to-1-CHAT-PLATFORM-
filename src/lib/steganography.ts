// Zero-width Steganography Encoder & Decoder
// Hides confidential data invisibly within everyday text using Unicode zero-width characters.

const ZERO_WIDTH_ZERO = '\u200B'; // Zero-Width Space (represents binary 0)
const ZERO_WIDTH_ONE = '\u200C';  // Zero-Width Non-Joiner (represents binary 1)
const ZERO_WIDTH_SEP = '\u200D';  // Zero-Width Joiner (delimiter)

// Checks if a string contains hidden zero-width characters
export function hasSteganography(text: string): boolean {
  if (!text) return false;
  return text.includes(ZERO_WIDTH_ZERO) || text.includes(ZERO_WIDTH_ONE);
}

// Encodes a hidden secret into binary and hides it inside a visible cover message
export function embedSteganography(coverText: string, secretText: string): string {
  if (!secretText) return coverText;
  
  // Convert secretText to UTF-8 binary string
  const encoder = new TextEncoder();
  const bytes = encoder.encode(secretText);
  let binary = '';
  
  for (let i = 0; i < bytes.length; i++) {
    const binByte = bytes[i].toString(2).padStart(8, '0');
    binary += binByte;
  }
  
  // Map binary 0/1 to zero-width chars
  let zeroWidthPayload = ZERO_WIDTH_SEP;
  for (const bit of binary) {
    zeroWidthPayload += bit === '0' ? ZERO_WIDTH_ZERO : ZERO_WIDTH_ONE;
  }
  zeroWidthPayload += ZERO_WIDTH_SEP;
  
  // Insert zeroWidthPayload into the cover text (e.g. after the first word or space, or at the end)
  if (coverText.includes(' ')) {
    const spaceIndex = coverText.indexOf(' ');
    return coverText.slice(0, spaceIndex + 1) + zeroWidthPayload + coverText.slice(spaceIndex + 1);
  }
  
  return coverText + zeroWidthPayload;
}

// Extracts and decodes the hidden secret from a steganographic message
export function extractSteganography(text: string): string | null {
  if (!text) return null;
  
  // Look for sequence between delimiters or extract all zero-width bits
  let binary = '';
  let inPayload = false;
  
  for (const char of text) {
    if (char === ZERO_WIDTH_SEP) {
      if (!inPayload) {
        inPayload = true;
      } else {
        // End of payload
        break;
      }
    } else if (char === ZERO_WIDTH_ZERO) {
      binary += '0';
    } else if (char === ZERO_WIDTH_ONE) {
      binary += '1';
    }
  }
  
  if (binary.length === 0 || binary.length % 8 !== 0) {
    return null;
  }
  
  try {
    const byteCount = binary.length / 8;
    const bytes = new Uint8Array(byteCount);
    for (let i = 0; i < byteCount; i++) {
      const byteStr = binary.slice(i * 8, (i + 1) * 8);
      bytes[i] = parseInt(byteStr, 2);
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch {
    return null;
  }
}

// Strips all zero-width steganographic characters to get clean text
export function sanitizeZeroWidth(text: string): string {
  if (!text) return '';
  return text
    .replace(new RegExp(ZERO_WIDTH_ZERO, 'g'), '')
    .replace(new RegExp(ZERO_WIDTH_ONE, 'g'), '')
    .replace(new RegExp(ZERO_WIDTH_SEP, 'g'), '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

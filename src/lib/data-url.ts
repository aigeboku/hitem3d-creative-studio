export interface ParsedDataUrl {
  mimeType: string;
  base64: string;
}

const DATA_URL_PATTERN = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/;

export function parseDataUrl(dataUrl: string): ParsedDataUrl | null {
  const match = dataUrl.match(DATA_URL_PATTERN);
  if (!match) return null;

  const mimeType = match[1];
  const base64 = match[2];
  if (!mimeType || !base64) return null;

  return { mimeType, base64 };
}

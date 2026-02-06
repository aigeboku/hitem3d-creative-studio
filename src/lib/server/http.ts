import { EXTERNAL_API_TIMEOUT_MS } from "./config";

export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = EXTERNAL_API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function readJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

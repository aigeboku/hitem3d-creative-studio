import type { NextRequest } from "next/server";
import { HITEM3D_BASE_URL } from "./config";
import { fetchWithTimeout, readJsonSafely } from "./http";
import {
  getHitem3dCredentials,
  getHitem3dToken,
  type Hitem3dToken,
} from "./secure-cookies";

interface TokenSuccess {
  token: string;
  refreshedToken?: Hitem3dToken;
}

interface TokenFailure {
  error: string;
  status: number;
}

type TokenResult = TokenSuccess | TokenFailure;

export async function resolveHitem3dToken(
  request: NextRequest
): Promise<TokenResult> {
  const storedToken = getHitem3dToken(request);
  if (storedToken && storedToken.expiresAt > Date.now() + 15_000) {
    return { token: storedToken.token };
  }

  const credentials = getHitem3dCredentials(request);
  if (!credentials) {
    return {
      error:
        "Hitem3D credentials are not configured. Please register them in Settings.",
      status: 401,
    };
  }

  const authResponse = await fetchWithTimeout(
    `${HITEM3D_BASE_URL}/open-api/v1/auth/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${credentials.accessKey}:${credentials.secretKey}`
        ).toString("base64")}`,
      },
    }
  );

  const authData = await readJsonSafely(authResponse);
  const token = extractToken(authData);

  if (!authResponse.ok || !isSuccessCode(authData) || !token) {
    return {
      error: "Failed to authenticate with Hitem3D. Please re-check credentials.",
      status: authResponse.status === 401 ? 401 : 502,
    };
  }

  const expiresAt = extractExpireAt(authData);
  return {
    token,
    refreshedToken: {
      token,
      expiresAt,
    },
  };
}

export function isSuccessCode(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const code = (payload as { code?: unknown }).code;
  return code === 0 || code === 200 || code === "0" || code === "200";
}

export function extractToken(payload: unknown): string | null {
  const data = extractDataObject(payload);
  if (!data) return null;

  const tokenCandidate =
    (data as { accessToken?: unknown }).accessToken ??
    (data as { access_token?: unknown }).access_token ??
    (data as { token?: unknown }).token;

  return typeof tokenCandidate === "string" && tokenCandidate.length > 0
    ? tokenCandidate
    : null;
}

export function extractExpireAt(payload: unknown): number {
  const data = extractDataObject(payload);
  const expireRaw =
    (data as { expireTime?: unknown } | null)?.expireTime ??
    (data as { expire_time?: unknown } | null)?.expire_time ??
    (data as { expiresIn?: unknown } | null)?.expiresIn ??
    (data as { expires_in?: unknown } | null)?.expires_in;

  const parsed = parseExpireTime(expireRaw, Date.now());
  if (parsed !== null) return parsed;

  // HitEM3D access token expiry is around 24 hours.
  return Date.now() + 23 * 60 * 60 * 1000;
}

export function extractApiMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const message =
    (payload as { msg?: unknown }).msg ??
    (payload as { message?: unknown }).message;
  return typeof message === "string" && message.trim().length > 0
    ? message.trim()
    : null;
}

function extractDataObject(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as { data?: unknown }).data;
  return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
}

function parseExpireTime(raw: unknown, nowMs: number): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return normalizeTimeValue(raw, nowMs);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return normalizeTimeValue(numeric, nowMs);
    }

    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function normalizeTimeValue(value: number, nowMs: number): number {
  // values smaller than one year in seconds are treated as relative TTL.
  if (value > 0 && value < 365 * 24 * 60 * 60) {
    return nowMs + value * 1000;
  }
  // unix timestamp in seconds
  if (value > 0 && value < 10_000_000_000) {
    return value * 1000;
  }
  // unix timestamp in milliseconds
  return value;
}

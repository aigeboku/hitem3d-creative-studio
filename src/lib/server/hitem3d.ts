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
          `${credentials.username}:${credentials.password}`
        ).toString("base64")}`,
      },
    }
  );

  const authData = await readJsonSafely(authResponse);
  const token = extractToken(authData);

  if (!authResponse.ok || !token) {
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
  return typeof code === "number" && code === 0;
}

function extractToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const token = (data as { token?: unknown }).token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

function extractExpireAt(payload: unknown): number {
  if (!payload || typeof payload !== "object") {
    return Date.now() + 55 * 60 * 1000;
  }

  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") {
    return Date.now() + 55 * 60 * 1000;
  }

  const expireTime = (data as { expire_time?: unknown }).expire_time;
  if (typeof expireTime !== "string" || expireTime.length === 0) {
    return Date.now() + 55 * 60 * 1000;
  }

  const parsed = Date.parse(expireTime);
  if (Number.isNaN(parsed)) {
    return Date.now() + 55 * 60 * 1000;
  }

  return parsed;
}

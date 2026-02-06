import { NextRequest, NextResponse } from "next/server";
import { HITEM3D_BASE_URL } from "@/lib/server/config";
import { fetchWithTimeout, readJsonSafely } from "@/lib/server/http";
import { isSuccessCode } from "@/lib/server/hitem3d";
import {
  clearHitem3dCredentials,
  clearHitem3dToken,
  setHitem3dCredentials,
  setHitem3dToken,
} from "@/lib/server/secure-cookies";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/server/security";

interface AuthRequestBody {
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  const csrfError = enforceSameOrigin(request);
  if (csrfError) return csrfError;

  const rateLimitError = enforceRateLimit(request, {
    key: "hitem3d-auth",
    limit: 20,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  const body = await parseBody(request);
  if (!body) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 }
    );
  }

  try {
    const authResponse = await fetchWithTimeout(
      `${HITEM3D_BASE_URL}/open-api/v1/auth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${body.username}:${body.password}`
          ).toString("base64")}`,
        },
      }
    );

    const authData = await readJsonSafely(authResponse);
    const token = extractToken(authData);

    if (!authResponse.ok || !isSuccessCode(authData) || !token) {
      return NextResponse.json(
        { error: "Authentication failed. Please check your credentials." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ valid: true });
    setHitem3dCredentials(response, body);
    setHitem3dToken(response, {
      token,
      expiresAt: extractExpireAt(authData),
    });

    return response;
  } catch (error) {
    console.error("Hitem3D auth error:", error);
    return NextResponse.json(
      { error: "Unable to reach Hitem3D. Please try again." },
      { status: 502 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const csrfError = enforceSameOrigin(request);
  if (csrfError) return csrfError;

  const rateLimitError = enforceRateLimit(request, {
    key: "hitem3d-auth-delete",
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  const response = NextResponse.json({ cleared: true });
  clearHitem3dCredentials(response);
  clearHitem3dToken(response);
  return response;
}

async function parseBody(request: NextRequest): Promise<AuthRequestBody | null> {
  const raw = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object") return null;

  const username = (raw as { username?: unknown }).username;
  const password = (raw as { password?: unknown }).password;
  if (typeof username !== "string" || typeof password !== "string") {
    return null;
  }

  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();
  if (!trimmedUsername || !trimmedPassword) {
    return null;
  }

  if (trimmedUsername.length > 200 || trimmedPassword.length > 200) {
    return null;
  }

  return {
    username: trimmedUsername,
    password: trimmedPassword,
  };
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

  const parsedTime = Date.parse(expireTime);
  if (Number.isNaN(parsedTime)) {
    return Date.now() + 55 * 60 * 1000;
  }

  return parsedTime;
}

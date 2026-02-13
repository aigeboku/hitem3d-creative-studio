import { NextRequest, NextResponse } from "next/server";
import { HITEM3D_BASE_URL } from "@/lib/server/config";
import { fetchWithTimeout, readJsonSafely } from "@/lib/server/http";
import {
  extractApiMessage,
  extractExpireAt,
  extractToken,
  isSuccessCode,
} from "@/lib/server/hitem3d";
import {
  clearHitem3dCredentials,
  clearHitem3dToken,
  setHitem3dCredentials,
  setHitem3dToken,
} from "@/lib/server/secure-cookies";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/server/security";

interface AuthRequestBody {
  accessKey: string;
  secretKey: string;
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
      { error: "Access Key and Secret Key are required." },
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
            `${body.accessKey}:${body.secretKey}`
          ).toString("base64")}`,
        },
      }
    );

    const authData = await readJsonSafely(authResponse);
    const token = extractToken(authData);
    const upstreamMessage = extractApiMessage(authData);

    if (!authResponse.ok || !isSuccessCode(authData) || !token) {
      return NextResponse.json(
        {
          error:
            upstreamMessage || "Authentication failed. Please check your credentials.",
        },
        { status: authResponse.status === 401 ? 401 : 502 }
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
      { error: "Unable to reach Hitem3D. Please check API endpoint and try again." },
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

  const accessKeyRaw =
    (raw as { accessKey?: unknown }).accessKey ??
    (raw as { username?: unknown }).username;
  const apiKeyRaw =
    (raw as { secretKey?: unknown }).secretKey ??
    (raw as { apiSecretKey?: unknown }).apiSecretKey ??
    (raw as { clientSecret?: unknown }).clientSecret ??
    (raw as { apiKey?: unknown }).apiKey ??
    (raw as { password?: unknown }).password;

  if (typeof accessKeyRaw !== "string" || typeof apiKeyRaw !== "string") {
    return null;
  }

  const accessKey = accessKeyRaw.trim();
  const apiKey = apiKeyRaw.trim();
  if (!accessKey || !apiKey) {
    return null;
  }

  if (accessKey.length > 200 || apiKey.length > 200) {
    return null;
  }

  return {
    accessKey,
    secretKey: apiKey,
  };
}

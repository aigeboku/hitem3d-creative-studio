import { NextRequest, NextResponse } from "next/server";
import { HITEM3D_BASE_URL } from "@/lib/server/config";
import {
  extractApiMessage,
  isSuccessCode,
  resolveHitem3dToken,
} from "@/lib/server/hitem3d";
import { fetchWithTimeout, readJsonSafely } from "@/lib/server/http";
import { setHitem3dToken } from "@/lib/server/secure-cookies";
import { enforceRateLimit } from "@/lib/server/security";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, {
    key: "hitem3d-balance",
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  try {
    const tokenResult = await resolveHitem3dToken(request);
    if ("error" in tokenResult) {
      return NextResponse.json(
        { error: tokenResult.error },
        { status: tokenResult.status }
      );
    }

    const upstreamResponse = await fetchWithTimeout(
      `${HITEM3D_BASE_URL}/open-api/v1/balance`,
      {
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
        },
      }
    );

    const payload = await readJsonSafely(upstreamResponse);
    const balance = extractNumber(payload, ["totalBalance", "balance"]);
    const used = extractNumber(payload, ["usedBalance", "used"]) ?? 0;
    const upstreamMessage = extractApiMessage(payload);

    if (!upstreamResponse.ok || !isSuccessCode(payload) || balance === null) {
      return NextResponse.json(
        { error: upstreamMessage || "Failed to fetch balance from Hitem3D." },
        { status: upstreamResponse.status === 401 ? 401 : 502 }
      );
    }

    const response = NextResponse.json({ balance, used });
    if (tokenResult.refreshedToken) {
      setHitem3dToken(response, tokenResult.refreshedToken);
    }
    return response;
  } catch (error) {
    console.error("Hitem3D balance error:", error);
    return NextResponse.json(
      { error: "Unable to reach Hitem3D. Please try again." },
      { status: 502 }
    );
  }
}

function extractNumber(payload: unknown, keys: string[]): number | null {
  if (!payload || typeof payload !== "object") return null;
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;

  for (const key of keys) {
    const value = (data as Record<string, unknown>)[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }

  return null;
}

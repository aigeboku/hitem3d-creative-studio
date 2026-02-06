import { NextRequest, NextResponse } from "next/server";
import {
  hasGeminiApiKey,
  hasHitem3dCredentials,
} from "@/lib/server/secure-cookies";
import { enforceRateLimit } from "@/lib/server/security";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, {
    key: "credentials-status",
    limit: 120,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  return NextResponse.json({
    hasHitem3dCredentials: hasHitem3dCredentials(request),
    hasGeminiApiKey: hasGeminiApiKey(request),
  });
}

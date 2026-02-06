import { NextRequest, NextResponse } from "next/server";

const rateWindow = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export function enforceSameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const host = request.headers.get("host");
  if (!host) {
    return NextResponse.json({ error: "Forbidden request origin" }, { status: 403 });
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return NextResponse.json({ error: "Forbidden request origin" }, { status: 403 });
  }

  const allowedOriginFromEnv = process.env.APP_ORIGIN?.trim();
  const allowedOrigins = new Set<string>([
    `https://${host}`,
    `http://${host}`,
    ...(allowedOriginFromEnv ? [allowedOriginFromEnv] : []),
  ]);

  if (!allowedOrigins.has(originUrl.origin)) {
    return NextResponse.json({ error: "Forbidden request origin" }, { status: 403 });
  }

  return null;
}

export function enforceRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const ip = getClientIp(request);
  const now = Date.now();
  const bucketKey = `${options.key}:${ip}`;
  const previous = rateWindow.get(bucketKey);

  if (!previous || previous.resetAt <= now) {
    rateWindow.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (previous.count >= options.limit) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  previous.count += 1;
  rateWindow.set(bucketKey, previous);
  return null;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

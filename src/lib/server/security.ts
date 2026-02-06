import { NextRequest, NextResponse } from "next/server";

const rateWindow = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60_000;
const RATE_LIMIT_MAX_ENTRIES = 10_000;
let lastCleanupAt = 0;

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export function enforceSameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const secFetchSite = request.headers.get("sec-fetch-site");

  if (!origin) {
    if (secFetchSite === "cross-site") {
      return NextResponse.json(
        { error: "Forbidden request origin" },
        { status: 403 }
      );
    }
    return null;
  }

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
  cleanupRateWindow(now);

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

function cleanupRateWindow(now: number): void {
  const needsSizeCleanup = rateWindow.size > RATE_LIMIT_MAX_ENTRIES;
  if (
    !needsSizeCleanup &&
    now - lastCleanupAt < RATE_LIMIT_CLEANUP_INTERVAL_MS
  ) {
    return;
  }

  for (const [key, value] of rateWindow.entries()) {
    if (value.resetAt <= now) {
      rateWindow.delete(key);
    }
  }

  if (rateWindow.size > RATE_LIMIT_MAX_ENTRIES) {
    const overflow = rateWindow.size - RATE_LIMIT_MAX_ENTRIES;
    let removed = 0;
    for (const key of rateWindow.keys()) {
      rateWindow.delete(key);
      removed += 1;
      if (removed >= overflow) break;
    }
  }

  lastCleanupAt = now;
}

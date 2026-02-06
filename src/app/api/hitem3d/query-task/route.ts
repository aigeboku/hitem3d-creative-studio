import { NextRequest, NextResponse } from "next/server";
import { HITEM3D_BASE_URL } from "@/lib/server/config";
import { resolveHitem3dToken } from "@/lib/server/hitem3d";
import { fetchWithTimeout, readJsonSafely } from "@/lib/server/http";
import { setHitem3dToken } from "@/lib/server/secure-cookies";
import { enforceRateLimit } from "@/lib/server/security";
import type { Hitem3DTaskStatus } from "@/types/hitem3d";

export async function GET(request: NextRequest) {
  const rateLimitError = enforceRateLimit(request, {
    key: "hitem3d-query",
    limit: 180,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  const taskId = request.nextUrl.searchParams.get("task_id");
  if (!taskId) {
    return NextResponse.json(
      { error: "Missing task_id parameter." },
      { status: 400 }
    );
  }

  if (taskId.length > 200) {
    return NextResponse.json(
      { error: "Invalid task_id parameter." },
      { status: 400 }
    );
  }

  try {
    const tokenResult = await resolveHitem3dToken(request);
    if ("error" in tokenResult) {
      return NextResponse.json(
        { error: tokenResult.error },
        { status: tokenResult.status }
      );
    }

    const upstreamResponse = await fetchWithTimeout(
      `${HITEM3D_BASE_URL}/open-api/v1/query-task?task_id=${encodeURIComponent(
        taskId
      )}`,
      {
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
        },
      }
    );

    const payload = await readJsonSafely(upstreamResponse);
    const parsedTask = parseTask(payload);

    if (!upstreamResponse.ok || !parsedTask) {
      return NextResponse.json(
        { error: "Failed to query task status." },
        { status: upstreamResponse.status === 401 ? 401 : 502 }
      );
    }

    const response = NextResponse.json(parsedTask);
    if (tokenResult.refreshedToken) {
      setHitem3dToken(response, tokenResult.refreshedToken);
    }
    return response;
  } catch (error) {
    console.error("Hitem3D query-task error:", error);
    return NextResponse.json(
      { error: "Unable to query task. Please try again." },
      { status: 502 }
    );
  }
}

function parseTask(payload: unknown): {
  status: Hitem3DTaskStatus;
  progress: number;
  outputUrl: string | null;
  errorMessage: string | null;
} | null {
  if (!payload || typeof payload !== "object") return null;

  const code = (payload as { code?: unknown }).code;
  if (typeof code !== "number" || code !== 0) return null;

  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;

  const status = (data as { status?: unknown }).status;
  if (
    status !== "waiting" &&
    status !== "processing" &&
    status !== "success" &&
    status !== "failed"
  ) {
    return null;
  }

  const progressRaw = (data as { progress?: unknown }).progress;
  const progress =
    typeof progressRaw === "number" && Number.isFinite(progressRaw)
      ? Math.max(0, Math.min(100, progressRaw))
      : 0;

  const outputUrlRaw = (data as { output_url?: unknown }).output_url;
  const errorMessageRaw = (data as { error_message?: unknown }).error_message;

  return {
    status,
    progress,
    outputUrl: typeof outputUrlRaw === "string" ? outputUrlRaw : null,
    errorMessage: typeof errorMessageRaw === "string" ? errorMessageRaw : null,
  };
}

import { NextRequest, NextResponse } from "next/server";
import { HITEM3D_BASE_URL } from "@/lib/server/config";
import { resolveHitem3dToken } from "@/lib/server/hitem3d";
import { fetchWithTimeout, readJsonSafely } from "@/lib/server/http";
import { setHitem3dToken } from "@/lib/server/secure-cookies";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/server/security";

export async function POST(request: NextRequest) {
  const csrfError = enforceSameOrigin(request);
  if (csrfError) return csrfError;

  const rateLimitError = enforceRateLimit(request, {
    key: "hitem3d-submit",
    limit: 20,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "An image file is required." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are supported." },
        { status: 400 }
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image is too large. Please upload a file under 20MB." },
        { status: 400 }
      );
    }

    const tokenResult = await resolveHitem3dToken(request);
    if ("error" in tokenResult) {
      return NextResponse.json(
        { error: tokenResult.error },
        { status: tokenResult.status }
      );
    }

    const upstreamFormData = new FormData();
    upstreamFormData.append("file", file);
    upstreamFormData.append("generate_type", "glb");

    const upstreamResponse = await fetchWithTimeout(
      `${HITEM3D_BASE_URL}/open-api/v1/submit-task`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
        },
        body: upstreamFormData,
      }
    );

    const payload = await readJsonSafely(upstreamResponse);
    const taskId = extractTaskId(payload);

    if (!upstreamResponse.ok || !taskId) {
      return NextResponse.json(
        { error: "Failed to submit task to Hitem3D." },
        { status: upstreamResponse.status === 401 ? 401 : 502 }
      );
    }

    const response = NextResponse.json({ taskId });
    if (tokenResult.refreshedToken) {
      setHitem3dToken(response, tokenResult.refreshedToken);
    }
    return response;
  } catch (error) {
    console.error("Hitem3D submit-task error:", error);
    return NextResponse.json(
      { error: "Unable to submit task. Please try again." },
      { status: 502 }
    );
  }
}

function extractTaskId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const code = (payload as { code?: unknown }).code;
  if (typeof code !== "number" || code !== 0) return null;

  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const taskId = (data as { task_id?: unknown }).task_id;

  return typeof taskId === "string" && taskId.length > 0 ? taskId : null;
}

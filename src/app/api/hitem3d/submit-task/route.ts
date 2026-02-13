import { NextRequest, NextResponse } from "next/server";
import {
  HITEM3D_BASE_URL,
  HITEM3D_MODEL,
  HITEM3D_RESOLUTION,
} from "@/lib/server/config";
import {
  extractApiMessage,
  isSuccessCode,
  resolveHitem3dToken,
} from "@/lib/server/hitem3d";
import { fetchWithTimeout, readJsonSafely } from "@/lib/server/http";
import { setHitem3dToken } from "@/lib/server/secure-cookies";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/server/security";

const SUBMIT_UPSTREAM_TIMEOUT_MS = 16_000;

interface SubmitVariant {
  label: string;
  endpoint: string;
  buildBody: () => FormData;
}

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

    const variants: SubmitVariant[] = [
      {
        label: "submit-task modern(images)",
        endpoint: "/open-api/v1/submit-task",
        buildBody: () => buildModernSubmitBody(file, "images", HITEM3D_MODEL, HITEM3D_RESOLUTION),
      },
      {
        label: "submit-task modern(images[])",
        endpoint: "/open-api/v1/submit-task",
        buildBody: () =>
          buildModernSubmitBody(file, "images[]", HITEM3D_MODEL, HITEM3D_RESOLUTION),
      },
      {
        label: "submit-task legacy(file/generate_type)",
        endpoint: "/open-api/v1/submit-task",
        buildBody: () => buildLegacySubmitBody(file),
      },
      {
        label: "create-task modern(images)",
        endpoint: "/open-api/v1/create-task",
        buildBody: () => buildModernSubmitBody(file, "images", HITEM3D_MODEL, HITEM3D_RESOLUTION),
      },
    ];

    const failureMessages: string[] = [];

    for (const variant of variants) {
      const upstreamResponse = await fetchWithTimeout(
        `${HITEM3D_BASE_URL}${variant.endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenResult.token}`,
          },
          body: variant.buildBody(),
        },
        SUBMIT_UPSTREAM_TIMEOUT_MS
      );

      const payload = await readJsonSafely(upstreamResponse);
      const taskId = extractTaskId(payload);
      const message = buildUpstreamMessage(variant.label, upstreamResponse.status, payload);

      if (upstreamResponse.ok && taskId) {
        const response = NextResponse.json({ taskId });
        if (tokenResult.refreshedToken) {
          setHitem3dToken(response, tokenResult.refreshedToken);
        }
        return response;
      }

      if (upstreamResponse.status === 401) {
        return NextResponse.json(
          {
            error:
              extractApiMessage(payload) ||
              "Authentication failed. Please check your credentials.",
          },
          { status: 401 }
        );
      }

      failureMessages.push(message);
      console.warn("Hitem3D submit variant failed:", {
        variant: variant.label,
        status: upstreamResponse.status,
        code: extractUpstreamCode(payload),
        message: extractApiMessage(payload),
      });
    }

    const combinedMessage =
      failureMessages.find((value) => value.length > 0) ||
      "Failed to submit task to Hitem3D.";
    return NextResponse.json(
      { error: combinedMessage },
      { status: combinedMessage.includes("status=400") ? 400 : 502 }
    );
  } catch (error) {
    console.error("Hitem3D submit-task error:", error);
    return NextResponse.json(
      { error: "Unable to submit task. Please try again." },
      { status: 502 }
    );
  }
}

function buildModernSubmitBody(
  file: File,
  fieldName: "images" | "images[]",
  model: string,
  resolution: string
): FormData {
  const form = new FormData();
  form.append("request_type", "3");
  form.append("model", model);
  form.append("resolution", resolution);
  form.append("format", "2");
  form.append(fieldName, file);
  return form;
}

function buildLegacySubmitBody(file: File): FormData {
  const form = new FormData();
  form.append("file", file);
  form.append("generate_type", "glb");
  return form;
}

function buildUpstreamMessage(
  variantLabel: string,
  status: number,
  payload: unknown
): string {
  const upstreamCode = extractUpstreamCode(payload);
  const upstreamMessage = extractApiMessage(payload);
  const detailParts = [
    `variant=${variantLabel}`,
    `status=${status}`,
    upstreamCode !== null ? `code=${upstreamCode}` : null,
    upstreamMessage ? `message=${upstreamMessage}` : null,
  ].filter(Boolean);
  return `Task submission failed (${detailParts.join(", ")}).`;
}

function extractUpstreamCode(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const code = (payload as { code?: unknown }).code;
  if (typeof code === "number" && Number.isFinite(code)) return String(code);
  if (typeof code === "string" && code.trim().length > 0) return code.trim();
  return null;
}

function extractTaskId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  if (!isSuccessCode(payload)) return null;

  return (
    findTaskId((payload as { data?: unknown }).data, 0) ??
    findTaskId((payload as { taskId?: unknown }).taskId, 0) ??
    findTaskId((payload as { task_id?: unknown }).task_id, 0)
  );
}

function findTaskId(value: unknown, depth: number): string | null {
  if (depth > 4) return null;

  const normalized = normalizeTaskId(value);
  if (normalized) return normalized;

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findTaskId(item, depth + 1);
      if (nested) return nested;
    }
    return null;
  }

  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  return (
    normalizeTaskId(record.taskId) ??
    normalizeTaskId(record.task_id) ??
    normalizeTaskId(record.id) ??
    normalizeTaskId(record.jobId) ??
    normalizeTaskId(record.job_id) ??
    normalizeTaskId(record.uuid) ??
    findTaskId(record.data, depth + 1) ??
    findTaskId(record.result, depth + 1)
  );
}

function normalizeTaskId(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

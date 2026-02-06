import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "@/lib/server/config";
import {
  clearGeminiApiKey,
  getGeminiApiKey,
  setGeminiApiKey,
} from "@/lib/server/secure-cookies";
import { enforceRateLimit, enforceSameOrigin } from "@/lib/server/security";
import type { ReferenceImage } from "@/types/gemini";

interface ValidationRequestBody {
  validate: true;
  apiKey: string;
}

interface GenerationRequestBody {
  prompt: string;
  referenceImages: ReferenceImage[];
}

export async function POST(request: NextRequest) {
  const csrfError = enforceSameOrigin(request);
  if (csrfError) return csrfError;

  const rateLimitError = enforceRateLimit(request, {
    key: "gemini-generate",
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validationBody = parseValidationBody(body);
  if (validationBody) {
    return validateAndStoreApiKey(validationBody.apiKey);
  }

  const generationBody = parseGenerationBody(body);
  if (!generationBody) {
    return NextResponse.json(
      { error: "Prompt and reference images are required." },
      { status: 400 }
    );
  }

  const apiKey = getGeminiApiKey(request);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured. Please set it in Settings." },
      { status: 401 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await promiseWithTimeout(
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              ...generationBody.referenceImages.map((img) => ({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.base64,
                },
              })),
              { text: generationBody.prompt },
            ],
          },
        ],
        config: {
          responseModalities: ["Text", "Image"],
        },
      }),
      60_000
    );

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 }
      );
    }

    const imagePart = parts.find((part) => part.inlineData?.data);
    if (imagePart?.inlineData?.data) {
      return NextResponse.json({
        imageData: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType || "image/png",
      });
    }

    return NextResponse.json(
      { error: "Gemini did not return an image for this prompt." },
      { status: 502 }
    );
  } catch (error) {
    console.error("Gemini generate error:", error);
    return NextResponse.json(
      { error: "Image generation failed. Please try again." },
      { status: 502 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const csrfError = enforceSameOrigin(request);
  if (csrfError) return csrfError;

  const rateLimitError = enforceRateLimit(request, {
    key: "gemini-generate-delete",
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimitError) return rateLimitError;

  const response = NextResponse.json({ cleared: true });
  clearGeminiApiKey(response);
  return response;
}

async function validateAndStoreApiKey(apiKey: string) {
  try {
    const ai = new GoogleGenAI({ apiKey });
    await promiseWithTimeout(ai.models.list(), 20_000);

    const response = NextResponse.json({ valid: true });
    setGeminiApiKey(response, apiKey);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid API key. Please check and try again." },
      { status: 401 }
    );
  }
}

function parseValidationBody(value: unknown): ValidationRequestBody | null {
  if (!value || typeof value !== "object") return null;

  const validate = (value as { validate?: unknown }).validate;
  const apiKey = (value as { apiKey?: unknown }).apiKey;
  if (validate !== true || typeof apiKey !== "string") return null;

  const trimmedApiKey = apiKey.trim();
  if (!trimmedApiKey) return null;

  return {
    validate: true,
    apiKey: trimmedApiKey,
  };
}

function parseGenerationBody(value: unknown): GenerationRequestBody | null {
  if (!value || typeof value !== "object") return null;

  const prompt = (value as { prompt?: unknown }).prompt;
  const referenceImages = (value as { referenceImages?: unknown }).referenceImages;

  if (typeof prompt !== "string" || !prompt.trim()) return null;
  if (prompt.length > 2000) return null;
  if (!Array.isArray(referenceImages) || referenceImages.length === 0) return null;
  if (referenceImages.length > 10) return null;

  const normalized: ReferenceImage[] = [];
  for (const item of referenceImages) {
    if (!item || typeof item !== "object") return null;
    const base64 = (item as { base64?: unknown }).base64;
    const mimeType = (item as { mimeType?: unknown }).mimeType;
    const label = (item as { label?: unknown }).label;

    if (typeof base64 !== "string" || !base64) return null;
    if (base64.length > 10_000_000) return null;
    if (typeof mimeType !== "string" || !mimeType.startsWith("image/")) return null;
    if (label !== undefined && typeof label !== "string") return null;

    normalized.push({
      base64,
      mimeType,
      label,
    });
  }

  return {
    prompt: prompt.trim(),
    referenceImages: normalized,
  };
}

async function promiseWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Operation timed out"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

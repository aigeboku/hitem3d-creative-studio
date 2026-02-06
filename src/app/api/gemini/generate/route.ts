import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-3-pro-image-preview";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("X-Gemini-Key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validation mode - just check if the key works
    if (body.validate) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        await ai.models.list();
        return NextResponse.json({ valid: true });
      } catch {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 401 }
        );
      }
    }

    const { prompt, referenceImages } = body;

    if (!prompt || !referenceImages || referenceImages.length === 0) {
      return NextResponse.json(
        { error: "Prompt and at least one reference image are required" },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Build parts: images first, then prompt text
    const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

    for (const img of referenceImages) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: ["Text", "Image"],
      },
    });

    // Extract image from response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          return NextResponse.json({
            imageData: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png",
          });
        }
      }

      // No image found, check for text
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          return NextResponse.json({
            text: part.text,
            error: "No image generated, received text response instead",
          });
        }
      }
    }

    return NextResponse.json(
      { error: "No content in response" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Gemini generate error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

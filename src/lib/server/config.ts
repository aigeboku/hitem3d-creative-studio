const DEFAULT_HITEM3D_BASE_URL = "https://api.hitem3d.com";
const DEFAULT_GEMINI_MODEL = "gemini-3-pro-image-preview";

const rawHitem3dBaseUrl =
  process.env.HITEM3D_BASE_URL?.trim() || DEFAULT_HITEM3D_BASE_URL;

if (!rawHitem3dBaseUrl.startsWith("https://")) {
  throw new Error("HITEM3D_BASE_URL must use HTTPS.");
}

export const HITEM3D_BASE_URL = rawHitem3dBaseUrl.replace(/\/+$/, "");
export const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
export const EXTERNAL_API_TIMEOUT_MS = 20_000;

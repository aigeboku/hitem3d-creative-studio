const DEFAULT_HITEM3D_BASE_URL = "https://api.hitem3d.ai";
const DEFAULT_HITEM3D_MODEL = "hitem3dv1.5";
const DEFAULT_GEMINI_MODEL = "gemini-3-pro-image-preview";

const rawHitem3dBaseUrlInput =
  process.env.HITEM3D_BASE_URL?.trim() || DEFAULT_HITEM3D_BASE_URL;

// Backward compatibility: old config/docs used api.hitem3d.com.
const rawHitem3dBaseUrl = rawHitem3dBaseUrlInput.replace(
  /^https:\/\/api\.hitem3d\.com(?=\/|$)/,
  "https://api.hitem3d.ai"
);

if (!rawHitem3dBaseUrl.startsWith("https://")) {
  throw new Error("HITEM3D_BASE_URL must use HTTPS.");
}

export const HITEM3D_BASE_URL = rawHitem3dBaseUrl.replace(/\/+$/, "");
export const HITEM3D_MODEL =
  process.env.HITEM3D_MODEL?.trim() || DEFAULT_HITEM3D_MODEL;

const defaultResolutionByModel = HITEM3D_MODEL === "hitem3dv2.0" ? "1536" : "1024";
const rawHitem3dResolution =
  process.env.HITEM3D_RESOLUTION?.trim().toLowerCase() || defaultResolutionByModel;
const allowedResolutions = new Set(["512", "1024", "1536", "1536pro"]);
export const HITEM3D_RESOLUTION = allowedResolutions.has(rawHitem3dResolution)
  ? rawHitem3dResolution
  : defaultResolutionByModel;

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
export const EXTERNAL_API_TIMEOUT_MS = 20_000;

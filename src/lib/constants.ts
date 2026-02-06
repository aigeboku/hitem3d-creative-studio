import type { PromptPreset } from "@/types/gemini";

// Hitem3D API
export const HITEM3D_POLLING_INTERVAL = 3000;

// Default camera angle prompts (ported from NanobananaPro)
export const DEFAULT_PROMPTS: PromptPreset = {
  id: "camera-angles",
  name: "Camera Angles",
  prompts: [
    { id: 1, prompt: "Generate a close-up shot of this image.", label: "Close-up", icon: "🔍" },
    { id: 2, prompt: "Rotate the camera 45 degrees to the right.", label: "Right 45°", icon: "↗️" },
    { id: 3, prompt: "Generate an aerial view looking down from above.", label: "Aerial View", icon: "🦅" },
    { id: 4, prompt: "Rotate the camera 45 degrees to the left.", label: "Left 45°", icon: "↖️" },
    { id: 5, prompt: "Rotate the camera 90 degrees to the left.", label: "Left 90°", icon: "⬅️" },
    { id: 6, prompt: "Generate a low-angle shot looking up.", label: "Low Angle", icon: "📐" },
    { id: 7, prompt: "Rotate the camera 90 degrees to the right.", label: "Right 90°", icon: "➡️" },
    { id: 8, prompt: "Generate a wide-angle lens shot.", label: "Wide Angle", icon: "📷" },
  ],
};

export const LIGHTING_PRESETS: PromptPreset = {
  id: "lighting",
  name: "Lighting Variations",
  prompts: [
    { id: 1, prompt: "Add warm golden hour lighting to this image.", label: "Golden Hour", icon: "🌅" },
    { id: 2, prompt: "Add dramatic side lighting to this image.", label: "Side Light", icon: "💡" },
    { id: 3, prompt: "Convert to a nighttime scene with moonlight.", label: "Moonlight", icon: "🌙" },
    { id: 4, prompt: "Add soft diffused studio lighting.", label: "Studio", icon: "📸" },
    { id: 5, prompt: "Add neon lights and cyberpunk atmosphere.", label: "Neon", icon: "🌃" },
    { id: 6, prompt: "Add dramatic backlighting with silhouette effect.", label: "Backlight", icon: "🌄" },
    { id: 7, prompt: "Add colorful rainbow lighting.", label: "Rainbow", icon: "🌈" },
    { id: 8, prompt: "Convert to high contrast black and white.", label: "Mono", icon: "⬛" },
  ],
};

export const STYLE_PRESETS: PromptPreset = {
  id: "style",
  name: "Style Transform",
  prompts: [
    { id: 1, prompt: "Transform this into anime style artwork.", label: "Anime", icon: "🎨" },
    { id: 2, prompt: "Transform this into oil painting style.", label: "Oil Painting", icon: "🖼️" },
    { id: 3, prompt: "Transform this into watercolor painting.", label: "Watercolor", icon: "💧" },
    { id: 4, prompt: "Transform this into pixel art style.", label: "Pixel Art", icon: "👾" },
    { id: 5, prompt: "Transform this into pencil sketch.", label: "Sketch", icon: "✏️" },
    { id: 6, prompt: "Transform this into 3D rendered style.", label: "3D Render", icon: "🎮" },
    { id: 7, prompt: "Transform this into vintage photo style.", label: "Vintage", icon: "📷" },
    { id: 8, prompt: "Transform this into comic book style.", label: "Comic", icon: "💥" },
  ],
};

export const ALL_PRESETS: PromptPreset[] = [
  DEFAULT_PROMPTS,
  LIGHTING_PRESETS,
  STYLE_PRESETS,
];

// 3D Viewer preset angles
export const CAMERA_PRESETS = [
  { label: "Front", icon: "⬆️", position: [0, 0, 3] as [number, number, number] },
  { label: "Back", icon: "⬇️", position: [0, 0, -3] as [number, number, number] },
  { label: "Left", icon: "⬅️", position: [-3, 0, 0] as [number, number, number] },
  { label: "Right", icon: "➡️", position: [3, 0, 0] as [number, number, number] },
  { label: "Top", icon: "🔼", position: [0, 3, 0] as [number, number, number] },
  { label: "Front-Right", icon: "↗️", position: [2, 1, 2] as [number, number, number] },
  { label: "Front-Left", icon: "↖️", position: [-2, 1, 2] as [number, number, number] },
  { label: "Low Angle", icon: "📐", position: [2, -1, 2] as [number, number, number] },
];

// Wizard steps
export const WIZARD_STEPS = [
  { step: 1, label: "Upload", description: "Upload an image" },
  { step: 2, label: "3D Generate", description: "Generate 3D model" },
  { step: 3, label: "Screenshot", description: "Capture angles" },
  { step: 4, label: "AI Generate", description: "Generate new images" },
] as const;

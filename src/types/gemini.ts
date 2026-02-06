export interface GeminiGenerateRequest {
  prompt: string;
  referenceImages: ReferenceImage[];
}

export interface ReferenceImage {
  base64: string;
  mimeType: string;
  label?: string;
}

export interface GeminiGenerateResponse {
  imageData?: string;
  text?: string;
  error?: string;
}

export interface PromptPreset {
  id: string;
  name: string;
  prompts: PromptItem[];
}

export interface PromptItem {
  id: number;
  prompt: string;
  label: string;
  icon: string;
}

export interface ReferenceImage {
  base64: string;
  mimeType: string;
  label?: string;
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

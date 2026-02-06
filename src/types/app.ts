export type WizardStep = 1 | 2 | 3 | 4;

export interface Screenshot {
  id: string;
  dataUrl: string;
  label: string;
  timestamp: number;
}

export interface GeneratedImage {
  id: string;
  dataUrl: string;
  promptLabel: string;
  prompt: string;
  timestamp: number;
}

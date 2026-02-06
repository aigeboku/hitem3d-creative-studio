import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WizardStep, Screenshot, GeneratedImage } from "@/types/app";
import type { PromptItem } from "@/types/gemini";
import type { Hitem3DTaskStatus } from "@/types/hitem3d";
import { DEFAULT_PROMPTS } from "@/lib/constants";

interface AppState {
  // API Keys (persisted)
  hitem3dUsername: string;
  hitem3dPassword: string;
  geminiApiKey: string;
  setHitem3dCredentials: (username: string, password: string) => void;
  setGeminiApiKey: (key: string) => void;

  // Wizard
  currentStep: WizardStep;
  setCurrentStep: (step: WizardStep) => void;

  // Upload
  uploadedImage: string | null; // data URL
  uploadedImageFile: File | null;
  setUploadedImage: (dataUrl: string | null, file: File | null) => void;

  // 3D Generation
  taskId: string | null;
  taskStatus: Hitem3DTaskStatus | null;
  taskProgress: number;
  glbUrl: string | null;
  setTaskId: (id: string | null) => void;
  setTaskStatus: (status: Hitem3DTaskStatus | null) => void;
  setTaskProgress: (progress: number) => void;
  setGlbUrl: (url: string | null) => void;

  // Screenshots
  screenshots: Screenshot[];
  addScreenshot: (screenshot: Screenshot) => void;
  removeScreenshot: (id: string) => void;
  clearScreenshots: () => void;

  // Generation
  activePresetId: string;
  currentPrompts: PromptItem[];
  generatedImages: GeneratedImage[];
  setActivePresetId: (id: string) => void;
  setCurrentPrompts: (prompts: PromptItem[]) => void;
  addGeneratedImage: (image: GeneratedImage) => void;
  clearGeneratedImages: () => void;

  // Reset
  resetWorkflow: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // API Keys
      hitem3dUsername: "",
      hitem3dPassword: "",
      geminiApiKey: "",
      setHitem3dCredentials: (username, password) =>
        set({ hitem3dUsername: username, hitem3dPassword: password }),
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),

      // Wizard
      currentStep: 1,
      setCurrentStep: (step) => set({ currentStep: step }),

      // Upload
      uploadedImage: null,
      uploadedImageFile: null,
      setUploadedImage: (dataUrl, file) =>
        set({ uploadedImage: dataUrl, uploadedImageFile: file }),

      // 3D Generation
      taskId: null,
      taskStatus: null,
      taskProgress: 0,
      glbUrl: null,
      setTaskId: (id) => set({ taskId: id }),
      setTaskStatus: (status) => set({ taskStatus: status }),
      setTaskProgress: (progress) => set({ taskProgress: progress }),
      setGlbUrl: (url) => set({ glbUrl: url }),

      // Screenshots
      screenshots: [],
      addScreenshot: (screenshot) =>
        set((state) => ({ screenshots: [...state.screenshots, screenshot] })),
      removeScreenshot: (id) =>
        set((state) => ({
          screenshots: state.screenshots.filter((s) => s.id !== id),
        })),
      clearScreenshots: () => set({ screenshots: [] }),

      // Generation
      activePresetId: DEFAULT_PROMPTS.id,
      currentPrompts: DEFAULT_PROMPTS.prompts,
      generatedImages: [],
      setActivePresetId: (id) => set({ activePresetId: id }),
      setCurrentPrompts: (prompts) => set({ currentPrompts: prompts }),
      addGeneratedImage: (image) =>
        set((state) => ({
          generatedImages: [...state.generatedImages, image],
        })),
      clearGeneratedImages: () => set({ generatedImages: [] }),

      // Reset
      resetWorkflow: () =>
        set({
          currentStep: 1,
          uploadedImage: null,
          uploadedImageFile: null,
          taskId: null,
          taskStatus: null,
          taskProgress: 0,
          glbUrl: null,
          screenshots: [],
          generatedImages: [],
        }),
    }),
    {
      name: "hitem3d-creative-studio",
      partialize: (state) => ({
        hitem3dUsername: state.hitem3dUsername,
        hitem3dPassword: state.hitem3dPassword,
        geminiApiKey: state.geminiApiKey,
        activePresetId: state.activePresetId,
        currentPrompts: state.currentPrompts,
      }),
    }
  )
);

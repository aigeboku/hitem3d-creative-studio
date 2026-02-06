"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";
import { ALL_PRESETS } from "@/lib/constants";
import type { PromptItem } from "@/types/gemini";

interface GenerationConfigProps {
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
  selectedPrompts: PromptItem[];
  onSelectedPromptsChange: (prompts: PromptItem[]) => void;
}

export function GenerationConfig({
  customPrompt,
  onCustomPromptChange,
  selectedPrompts,
  onSelectedPromptsChange,
}: GenerationConfigProps) {
  const { activePresetId, setActivePresetId, setCurrentPrompts } =
    useAppStore();

  const handlePresetChange = (presetId: string) => {
    setActivePresetId(presetId);
    const preset = ALL_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCurrentPrompts(preset.prompts);
      onSelectedPromptsChange(preset.prompts);
    }
  };

  const togglePrompt = (prompt: PromptItem) => {
    const exists = selectedPrompts.find((p) => p.id === prompt.id);
    if (exists) {
      onSelectedPromptsChange(
        selectedPrompts.filter((p) => p.id !== prompt.id)
      );
    } else {
      onSelectedPromptsChange([...selectedPrompts, prompt]);
    }
  };

  const currentPreset = ALL_PRESETS.find((p) => p.id === activePresetId);
  const availablePrompts = currentPreset?.prompts || [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Preset</label>
        <Select value={activePresetId} onValueChange={handlePresetChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a preset" />
          </SelectTrigger>
          <SelectContent>
            {ALL_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Select Prompts ({selectedPrompts.length} selected)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availablePrompts.map((prompt) => {
            const isSelected = selectedPrompts.some((p) => p.id === prompt.id);
            return (
              <Button
                key={prompt.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="justify-start text-left h-auto py-2"
                onClick={() => togglePrompt(prompt)}
              >
                <span className="mr-2">{prompt.icon}</span>
                {prompt.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Custom Prompt (optional - added to each generation)
        </label>
        <Textarea
          value={customPrompt}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          placeholder="Add additional instructions..."
          rows={3}
        />
      </div>
    </div>
  );
}

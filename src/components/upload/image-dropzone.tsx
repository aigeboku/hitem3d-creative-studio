"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/stores/app-store";
import { useShallow } from "zustand/react/shallow";
import { useI18n } from "@/hooks/use-i18n";

export function ImageDropzone() {
  const { uploadedImage, setUploadedImage } = useAppStore(
    useShallow((state) => ({
      uploadedImage: state.uploadedImage,
      setUploadedImage: state.setUploadedImage,
    }))
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setUploadedImage(dataUrl, file);
      };
      reader.readAsDataURL(file);
    },
    [setUploadedImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    setUploadedImage(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (uploadedImage) {
    return (
      <div className="relative">
        <img
          src={uploadedImage}
          alt={t("Uploaded preview")}
          className="w-full max-h-80 object-contain rounded-lg border"
        />
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors text-lg leading-none"
        >
          &times;
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => fileInputRef.current?.click()}
      className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
    >
      <div className="space-y-3">
        <div className="text-4xl">📸</div>
        <h3 className="text-lg font-medium">{t("Upload an image")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("Click or drag & drop an image")}
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

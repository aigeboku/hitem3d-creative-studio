"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import { GeminiKeyForm } from "@/components/settings/gemini-key-form";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Link href="/">
            <Button variant="outline">Back to Studio</Button>
          </Link>
        </div>

        <div className="space-y-6">
          <ApiKeyForm />
          <GeminiKeyForm />

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
              Security Note
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              API keys are stored in your browser&apos;s localStorage only.
              This app is designed for local use only. Do not deploy to a public server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

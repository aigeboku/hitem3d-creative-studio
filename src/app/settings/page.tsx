"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ApiKeyForm } from "@/components/settings/api-key-form";
import { GeminiKeyForm } from "@/components/settings/gemini-key-form";
import { useI18n } from "@/hooks/use-i18n";

export default function SettingsPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">{t("Settings")}</h1>
          <Link href="/">
            <Button variant="outline">{t("Back to Studio")}</Button>
          </Link>
        </div>

        <div className="space-y-6">
          <ApiKeyForm />
          <GeminiKeyForm />

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
              {t("Setup Guide")}
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {t("1) Create a HitEM3D account and copy your Access Key / Secret Key.")}
              <br />
              {t("2) Create a Gemini API key from")}{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {t("Google AI Studio")}
              </a>
              .
              <br />
              {t("3) Save both credentials on this page.")}
              <br />
              {t("Credentials are stored in secure HttpOnly cookies on this browser.")}
              <br />
              {t("For production use, set `CREDENTIALS_COOKIE_SECRET` on the server.")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Header } from "@/components/layout/header";
import { WizardContainer } from "@/components/wizard/wizard-container";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4">
        <WizardContainer />
      </main>
    </div>
  );
}

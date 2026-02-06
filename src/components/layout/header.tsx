"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";

export function Header() {
  const resetWorkflow = useAppStore((state) => state.resetWorkflow);

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          <Link href="/" onClick={resetWorkflow} className="flex items-center gap-2">
            <span className="text-xl font-bold">3D Creative Studio</span>
          </Link>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              Settings
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

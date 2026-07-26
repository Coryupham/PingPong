"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/components/ui";

export function CopySignupLink({ path = "/sign-up" }: { path?: string }) {
  const [copied, setCopied] = useState(false);
  const [signupUrl, setSignupUrl] = useState(path);

  useEffect(() => {
    setSignupUrl(new URL(path, window.location.origin).toString());
  }, [path]);

  async function copyLink() {
    await navigator.clipboard.writeText(signupUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-4 grid gap-3 rounded-md border border-line bg-night/70 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <p className="min-w-0 truncate text-sm font-bold text-mist">{signupUrl}</p>
      <button
        type="button"
        onClick={copyLink}
        className={cn(
          "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-black",
          copied ? "bg-court text-night" : "border border-court/40 text-court hover:bg-court/10"
        )}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

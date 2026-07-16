"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold hover:bg-slate-50"
    >
      {copied ? <Check className="h-4 w-4 text-court" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

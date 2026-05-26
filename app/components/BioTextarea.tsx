"use client";

import { streamBioIntoTextarea, type GenerateBioInput } from "@/lib/stream-bio";
import { useRef, useState } from "react";
import { toast } from "sonner";

type BioTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  generateInput: GenerateBioInput;
  canGenerate: boolean;
  className?: string;
};

export default function BioTextarea({
  value,
  onChange,
  generateInput,
  canGenerate,
  className = "",
}: BioTextareaProps) {
  const [generating, setGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (!canGenerate || generating) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    try {
      await streamBioIntoTextarea(
        generateInput,
        onChange,
        controller.signal,
      );
      toast.success("Bio generated.");
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== "Cancelled") {
        toast.error(err.message, { duration: 6000 });
      }
    } finally {
      setGenerating(false);
    }
  };

  const mirrorText = value || " ";

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Bio
        </label>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
        >
          {generating ? "Generating…" : "Generate bio"}
        </button>
      </div>
      <div className="relative w-full">
        <div
          aria-hidden
          className="pointer-events-none invisible min-h-[5rem] whitespace-pre-wrap break-words px-3 py-2 text-sm leading-relaxed"
        >
          {mirrorText}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Professional bio (optional — or generate with AI)"
          rows={3}
          className="absolute inset-0 min-h-full w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
    </div>
  );
}

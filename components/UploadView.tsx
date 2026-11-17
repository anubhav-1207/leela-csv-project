"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Lock,
  MousePointerClick,
  ShieldCheck,
  UploadCloud,
  Zap,
} from "lucide-react";
import { SAMPLES, type SampleDataset } from "@/lib/sampleData";
import { Spinner } from "./ui";

interface UploadViewProps {
  onFile: (file: File) => void;
  onSample: (sample: SampleDataset) => void;
  error: string | null;
  loading: boolean;
}

export function UploadView({ onFile, onSample, error, loading }: UploadViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (files?.length) onFile(files[0]);
  }

  return (
    <div className="grid-fade mx-auto flex min-h-full w-full max-w-5xl flex-col items-center px-5 py-10 sm:py-16">
      <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/[0.07] px-3 py-1.5 text-xs font-medium text-accent">
        <Lock size={13} /> 100% local · no uploads · no sign-in
      </div>

      <h1 className="mt-6 text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Understand your data <span className="text-accent">instantly</span>
      </h1>
      <p className="mt-3 max-w-xl text-center text-sm leading-relaxed text-zinc-500 sm:text-base">
        Drop in a CSV and get real statistics, data-quality checks, charts and
        cleaning tools — computed entirely in your browser.
      </p>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative mt-9 w-full rounded-2xl border-2 border-dashed transition-colors ${
          dragging
            ? "border-accent/70 bg-accent/[0.06]"
            : "border-line bg-surface/60 hover:border-white/20 hover:bg-surface"
        }`}
      >
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-colors ${
              dragging
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-line bg-white/[0.03] text-zinc-400"
            }`}
          >
            {loading ? <Spinner size={26} /> : <UploadCloud size={28} strokeWidth={1.6} />}
          </div>
          <h2 className="mt-5 text-lg font-semibold text-white">
            {loading ? "Analyzing your dataset…" : "Drop your CSV here"}
          </h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            or choose a file from your computer
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt,text/csv"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="btn-primary mt-6"
          >
            <MousePointerClick size={15} /> Browse files
          </button>
          <div className="mt-4 flex items-center gap-2 text-[11px] text-zinc-600">
            <FileText size={12} /> .csv or .txt · large files processed in a background worker
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex w-full items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-200">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">We couldn’t read that file</div>
            <div className="mt-0.5 text-rose-200/70">{error}</div>
          </div>
        </div>
      )}

      <div className="mt-10 w-full">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-400">Or explore a sample dataset</h3>
          <span className="text-xs text-zinc-600">No download needed</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              disabled={loading}
              onClick={() => onSample(sample)}
              className="panel panel-hover group flex flex-col items-start p-4 text-left disabled:opacity-40"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-zinc-400 group-hover:text-accent">
                  <FileSpreadsheet size={16} />
                </div>
                <ArrowRight size={15} className="text-zinc-700 group-hover:text-accent" />
              </div>
              <div className="mt-3 text-sm font-medium text-zinc-200">{sample.name}</div>
              <div className="mt-1 text-xs leading-relaxed text-zinc-500">
                {sample.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid w-full gap-3 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Private by design", text: "Your data never leaves this device." },
          { icon: Zap, title: "Real calculations", text: "No samples, no placeholders, no APIs." },
          { icon: CheckCircle2, title: "Actionable cleanup", text: "Fix issues and export the result." },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3 rounded-xl border border-line/60 bg-surface/40 p-4">
            <item.icon size={17} className="mt-0.5 shrink-0 text-zinc-500" />
            <div>
              <div className="text-xs font-medium text-zinc-300">{item.title}</div>
              <div className="mt-1 text-xs text-zinc-600">{item.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

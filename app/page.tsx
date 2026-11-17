"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Columns3,
  Download,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { CleaningView } from "@/components/CleaningView";
import { ColumnAnalysisView } from "@/components/ColumnAnalysisView";
import { DataPreview } from "@/components/DataPreview";
import { DataQualityView } from "@/components/DataQualityView";
import { ExportView } from "@/components/ExportView";
import { Overview } from "@/components/Overview";
import { MobileMenuButton, Sidebar } from "@/components/Sidebar";
import { UploadView } from "@/components/UploadView";
import { VisualizationsView } from "@/components/VisualizationsView";
import { Spinner } from "@/components/ui";
import { analyzeDataset } from "@/lib/analysis";
import { processText } from "@/lib/processor";
import type { SampleDataset } from "@/lib/sampleData";
import type {
  Analysis,
  CleaningResult,
  Dataset,
  ParseWarning,
  ProcessedFile,
  Section,
} from "@/types";

const SECTION_META: Record<Section, { title: string; description: string; icon: LucideIcon }> = {
  overview: {
    title: "Overview",
    description: "A snapshot of your dataset and its overall health.",
    icon: LayoutDashboard,
  },
  preview: {
    title: "Data Preview",
    description: "Browse, search and sort the raw rows of your dataset.",
    icon: Table2,
  },
  columns: {
    title: "Column Analysis",
    description: "Type detection and detailed statistics for every column.",
    icon: Columns3,
  },
  quality: {
    title: "Data Quality",
    description: "Detect missing data, duplicates, outliers and inconsistencies.",
    icon: ShieldCheck,
  },
  visualizations: {
    title: "Visualizations",
    description: "Automatic charts tailored to each column's data type.",
    icon: BarChart3,
  },
  cleaning: {
    title: "Data Cleaning",
    description: "Fix issues safely — your original data stays untouched.",
    icon: Sparkles,
  },
  export: {
    title: "Export",
    description: "Download your cleaned data and complete analysis reports.",
    icon: Download,
  },
};

type Pending =
  | { kind: "load"; text: string; name: string; size: number; triedFallback: boolean }
  | { kind: "analyze"; dataset: Dataset; triedFallback: boolean };

interface WorkerResponse {
  id: number;
  ok: boolean;
  error?: string;
  kind?: "process" | "analyze";
  dataset?: Dataset;
  analysis?: Analysis;
  warnings?: ParseWarning[];
}

export default function Home() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [original, setOriginal] = useState<Dataset | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [warnings, setWarnings] = useState<ParseWarning[]>([]);
  const [history, setHistory] = useState<Dataset[]>([]);
  const [activity, setActivity] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [active, setActive] = useState<Section>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const idRef = useRef(0);
  const pendingRef = useRef<Map<number, Pending>>(new Map());

  const runFallback = useCallback((id: number) => {
    const pending = pendingRef.current.get(id);
    if (!pending) return;
    window.setTimeout(() => {
      try {
        if (pending.kind === "load") {
          const result = processText(pending.text, pending.name, pending.size);
          applyProcessed(result);
        } else {
          setAnalysis(analyzeDataset(pending.dataset));
        }
        pendingRef.current.delete(id);
        setAnalyzing(false);
      } catch (err) {
        pendingRef.current.delete(id);
        const message = err instanceof Error ? err.message : String(err);
        if (pending.kind === "load") {
          setStatus("idle");
          setError(message);
        }
        setAnalyzing(false);
      }
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWorkerMessage = useCallback(
    (response: WorkerResponse) => {
      const pending = pendingRef.current.get(response.id);
      if (!pending) return;

      if (response.ok) {
        if (pending.kind === "load" && response.dataset && response.analysis) {
          applyProcessed({
            dataset: response.dataset,
            analysis: response.analysis,
            warnings: response.warnings ?? [],
          });
        } else if (pending.kind === "analyze" && response.analysis) {
          setAnalysis(response.analysis);
        }
        pendingRef.current.delete(response.id);
        setAnalyzing(false);
        return;
      }

      // Worker errored — try the same pure functions on the main thread once.
      if (!pending.triedFallback) {
        pending.triedFallback = true;
        runFallback(response.id);
        return;
      }

      pendingRef.current.delete(response.id);
      setAnalyzing(false);
      if (pending.kind === "load") {
        setStatus("idle");
        setError(response.error ?? "Could not process this file.");
      }
    },
    [runFallback]
  );

  // --- Web Worker lifecycle -------------------------------------------------
  useEffect(() => {
    try {
      const worker = new Worker(
        new URL("../workers/analysis.worker.ts", import.meta.url)
      );
      worker.onmessage = (event: MessageEvent<WorkerResponse>) =>
        handleWorkerMessage(event.data);
      worker.onerror = () => {
        // Any failure to communicate falls through to the main-thread path.
      };
      workerRef.current = worker;
    } catch {
      workerRef.current = null;
    }
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [handleWorkerMessage]);

  function applyProcessed(result: ProcessedFile) {
    setOriginal(result.dataset);
    setDataset(result.dataset);
    setAnalysis(result.analysis);
    setWarnings(result.warnings);
    setHistory([]);
    setActivity([]);
    setStatus("ready");
    setError(null);
    setActive("overview");
  }

  const requestProcess = useCallback(
    (text: string, name: string, size: number) => {
      setStatus("loading");
      setError(null);
      setAnalyzing(false);
      const id = ++idRef.current;
      pendingRef.current.set(id, {
        kind: "load",
        text,
        name,
        size,
        triedFallback: false,
      });
      if (workerRef.current) {
        workerRef.current.postMessage({ id, type: "process", text, name, size });
      } else {
        runFallback(id);
      }
    },
    [runFallback]
  );

  const requestAnalyze = useCallback(
    (next: Dataset) => {
      setAnalyzing(true);
      const id = ++idRef.current;
      pendingRef.current.set(id, { kind: "analyze", dataset: next, triedFallback: false });
      if (workerRef.current) {
        workerRef.current.postMessage({ id, type: "analyze", dataset: next });
      } else {
        runFallback(id);
      }
    },
    [runFallback]
  );

  async function handleFile(file: File) {
    const validName = /\.(csv|txt)$/i.test(file.name);
    const validType = ["text/csv", "text/plain", "application/csv", ""].includes(file.type);
    if (!validName && !validType) {
      setError("Please choose a .csv or .txt file.");
      return;
    }
    if (file.size === 0) {
      setError("That file is empty. Choose a CSV file that contains data.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("This file is larger than 100 MB. Try a smaller CSV to keep analysis responsive.");
      return;
    }
    try {
      const text = await file.text();
      requestProcess(text, file.name, file.size);
    } catch {
      setError("We couldn't read that file. Please try again.");
    }
  }

  function handleSample(sample: SampleDataset) {
    const size = new TextEncoder().encode(sample.content).length;
    requestProcess(sample.content, sample.filename, size);
  }

  function handleApply(result: CleaningResult) {
    if (!dataset) return;
    setHistory((prev) => [...prev, dataset]);
    setDataset(result.dataset);
    setActivity((prev) => [result.description, ...prev].slice(0, 20));
    requestAnalyze(result.dataset);
  }

  function handleUndo() {
    if (!history.length) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setDataset(previous);
    setActivity((prev) => prev.slice(1));
    requestAnalyze(previous);
  }

  function handleReset() {
    if (!original) return;
    setDataset(original);
    setHistory([]);
    setActivity([]);
    requestAnalyze(original);
  }

  function handleNew() {
    setDataset(null);
    setOriginal(null);
    setAnalysis(null);
    setWarnings([]);
    setHistory([]);
    setActivity([]);
    setStatus("idle");
    setError(null);
    setActive("overview");
  }

  const section = SECTION_META[active];
  const hasChanges = !!dataset && !!original && dataset !== original;
  const HeaderIcon = section.icon;

  const content = useMemo(() => {
    if (!dataset || !analysis) return null;
    switch (active) {
      case "overview":
        return <Overview dataset={dataset} analysis={analysis} warnings={warnings} onNavigate={setActive} />;
      case "preview":
        return <DataPreview dataset={dataset} analysis={analysis} />;
      case "columns":
        return <ColumnAnalysisView analysis={analysis} />;
      case "quality":
        return <DataQualityView analysis={analysis} />;
      case "visualizations":
        return <VisualizationsView analysis={analysis} />;
      case "cleaning":
        return (
          <CleaningView
            dataset={dataset}
            analysis={analysis}
            onApply={handleApply}
            onReset={handleReset}
            onUndo={handleUndo}
            historyLength={history.length}
            activity={activity}
            hasChanges={hasChanges}
          />
        );
      case "export":
        return <ExportView dataset={dataset} analysis={analysis} warnings={warnings} />;
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, dataset, analysis, warnings, history.length, activity, hasChanges]);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        active={active}
        onSelect={setActive}
        dataset={dataset}
        analysis={analysis}
        hasChanges={hasChanges}
        onReset={handleReset}
        onNew={handleNew}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-md sm:px-6">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-zinc-400">
            <HeaderIcon size={16} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-white">{section.title}</h1>
              {analyzing && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                  <Spinner size={10} /> Updating
                </span>
              )}
            </div>
            <p className="hidden truncate text-[11px] text-zinc-500 sm:block">{section.description}</p>
          </div>
          {dataset && (
            <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="max-w-[180px] truncate text-xs text-zinc-400" title={dataset.name}>
                {dataset.name}
              </span>
            </div>
          )}
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
          {dataset && analysis ? (
            <div className="animate-fade-in">{content}</div>
          ) : (
            <UploadView
              onFile={handleFile}
              onSample={handleSample}
              error={error}
              loading={status === "loading"}
            />
          )}
        </main>
      </div>
    </div>
  );
}

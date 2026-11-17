"use client";

import {
  BarChart3,
  Check,
  Download,
  FileCode2,
  FileJson,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  downloadAnalysisReport,
  downloadCleanedCsv,
  downloadQualityReport,
  downloadStatisticalSummary,
} from "@/lib/exporters";
import { formatBytes, formatCompact } from "@/lib/format";
import type { Analysis, Dataset, ParseWarning } from "@/types";
import { Panel } from "./ui";

interface ExportViewProps {
  dataset: Dataset;
  analysis: Analysis;
  warnings: ParseWarning[];
}

export function ExportView({ dataset, analysis, warnings }: ExportViewProps) {
  const exports: {
    icon: LucideIcon;
    title: string;
    format: string;
    description: string;
    detail: string;
    onClick: () => void;
  }[] = [
    {
      icon: FileSpreadsheet,
      title: "Cleaned dataset",
      format: "CSV",
      description: "Download the current dataset, including every cleaning change you applied.",
      detail: `${formatCompact(dataset.rows.length)} rows × ${dataset.columns.length} columns`,
      onClick: () => downloadCleanedCsv(dataset),
    },
    {
      icon: FileJson,
      title: "Full analysis report",
      format: "JSON",
      description: "A complete machine-readable report: overview, quality findings, per-column statistics and correlations.",
      detail: `${analysis.columns.length} columns analyzed`,
      onClick: () => downloadAnalysisReport(dataset, analysis, warnings),
    },
    {
      icon: BarChart3,
      title: "Statistical summary",
      format: "CSV",
      description: "A compact table of descriptive statistics for every column — ideal for spreadsheets.",
      detail: "mean, median, quartiles, std dev & more",
      onClick: () => downloadStatisticalSummary(analysis),
    },
    {
      icon: ShieldCheck,
      title: "Data quality report",
      format: "CSV",
      description: "Every detected issue with its severity, affected count and the columns involved.",
      detail: `${analysis.quality.issues.length} findings · score ${analysis.quality.score}/100`,
      onClick: () => downloadQualityReport(analysis),
    },
  ];

  return (
    <div className="space-y-5">
      <Panel className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
            <Download size={19} />
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-100">Ready to export</div>
            <div className="mt-0.5 text-xs text-zinc-500">
              All files are generated locally in your browser — nothing is uploaded.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
          <FileSpreadsheet size={14} className="text-zinc-500" />
          <span className="max-w-[200px] truncate text-xs text-zinc-300" title={dataset.name}>
            {dataset.name}
          </span>
          <span className="text-xs text-zinc-600">· {formatBytes(dataset.size)}</span>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {exports.map((item) => (
          <Panel key={item.title} className="flex flex-col p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-zinc-400">
                <item.icon size={17} strokeWidth={1.7} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-medium text-zinc-100">{item.title}</h3>
                  <span className="pill px-2 py-0.5 font-mono text-[10px] text-accent">{item.format}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{item.description}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                <Check size={12} className="text-accent" /> {item.detail}
              </span>
              <button type="button" onClick={item.onClick} className="btn-primary shrink-0 text-xs">
                <Download size={14} /> Download
              </button>
            </div>
          </Panel>
        ))}
      </div>

      <Panel className="p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-200">
          <FileCode2 size={16} className="text-accent" /> What’s in the analysis report
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["meta", "Source file, size and generation timestamp"],
            ["overview", "Rows, columns, cells, missing and duplicates"],
            ["quality", "Score and every finding with explanations"],
            ["columns", "Type detection and full descriptive statistics"],
            ["correlations", "Pearson r between numeric columns"],
            ["warnings", "Any parsing notes from the original file"],
          ].map(([key, description]) => (
            <div key={key} className="rounded-lg border border-line bg-canvas/50 p-3">
              <div className="font-mono text-[11px] text-accent">{key}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-zinc-500">{description}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

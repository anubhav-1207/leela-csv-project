"use client";

import {
  AlertTriangle,
  ArrowRight,
  Binary,
  CalendarDays,
  Columns3,
  Database,
  Grid3X3,
  HardDrive,
  Rows3,
  ShieldCheck,
  Type,
} from "lucide-react";
import { formatBytes, formatCompact, formatNumber, formatPercent } from "@/lib/format";
import { severityStyles } from "@/lib/format";
import type { Analysis, Dataset, ParseWarning, Section } from "@/types";
import { Panel, ProgressBar, SeverityBadge, StatCard, TypeBadge } from "./ui";

interface OverviewProps {
  dataset: Dataset;
  analysis: Analysis;
  warnings: ParseWarning[];
  onNavigate: (section: Section) => void;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#2dd4bf" : score >= 55 ? "#fbbf24" : "#fb7185";
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1d222b" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-semibold text-white">{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">score</span>
      </div>
    </div>
  );
}

export function Overview({ dataset, analysis, warnings, onNavigate }: OverviewProps) {
  const { overview, quality, columns } = analysis;
  const cards = [
    { icon: Rows3, label: "Total rows", value: formatCompact(overview.rows), hint: "data records" },
    { icon: Columns3, label: "Total columns", value: String(overview.columns), hint: "fields" },
    { icon: Grid3X3, label: "Total cells", value: formatCompact(overview.cells), hint: "rows × columns" },
    {
      icon: AlertTriangle,
      label: "Missing values",
      value: formatCompact(overview.missing),
      hint: formatPercent(overview.missingPercentage),
      tone: overview.missing > 0 ? ("amber" as const) : ("default" as const),
    },
    {
      icon: Database,
      label: "Duplicate rows",
      value: formatCompact(overview.duplicates),
      hint: "exact copies",
      tone: overview.duplicates > 0 ? ("rose" as const) : ("default" as const),
    },
    { icon: Binary, label: "Numeric columns", value: String(overview.numericColumns), hint: "int & float", tone: "sky" as const },
    { icon: Type, label: "Categorical columns", value: String(overview.categoricalColumns), hint: "text, bool, date" },
    { icon: HardDrive, label: "File size", value: formatBytes(overview.size), hint: "source file" },
  ] as const;

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-300">
            <AlertTriangle size={15} /> Parsing notes
          </div>
          <ul className="mt-2 space-y-1 text-xs text-amber-200/60">
            {warnings.slice(0, 4).map((warning, i) => (
              <li key={i}>• {warning.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            hint={card.hint}
            tone={"tone" in card ? card.tone : "default"}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel className="p-5 xl:col-span-1">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-200">
            <ShieldCheck size={16} className="text-accent" /> Data quality
          </div>
          <div className="flex items-center gap-6">
            <ScoreRing score={quality.score} />
            <div className="flex-1 space-y-2.5">
              {(["error", "warning", "info"] as const).map((severity) => {
                const style = severityStyles[severity];
                return (
                  <div key={severity} className="flex items-center gap-2 text-xs">
                    <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                    <span className="flex-1 capitalize text-zinc-500">{severity}</span>
                    <span className="font-mono font-medium text-zinc-300">
                      {quality.counts[severity]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {quality.issues.slice(0, 3).map((issue) => (
              <div key={issue.id} className="flex items-center gap-2 rounded-lg border border-line/60 bg-canvas/50 px-3 py-2">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${severityStyles[issue.severity].dot}`} />
                <span className="flex-1 truncate text-xs text-zinc-300">{issue.title}</span>
                <SeverityBadge severity={issue.severity} />
              </div>
            ))}
            {quality.issues.length === 0 && (
              <div className="rounded-lg border border-accent/20 bg-accent/[0.05] px-3 py-3 text-center text-xs text-accent">
                No quality issues detected
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate("quality")}
            className="btn-ghost mt-4 w-full text-xs"
          >
            View full quality report <ArrowRight size={14} />
          </button>
        </Panel>

        <Panel className="overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
              <Columns3 size={16} className="text-accent" /> Schema
            </div>
            <button
              type="button"
              onClick={() => onNavigate("columns")}
              className="text-xs text-zinc-500 hover:text-accent"
            >
              Analyze columns →
            </button>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-panel2 text-[10px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Column</th>
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 text-right font-medium">Non-null</th>
                  <th className="px-3 py-2.5 text-right font-medium">Missing</th>
                  <th className="px-3 py-2.5 text-right font-medium">Unique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {columns.slice(0, 12).map((column) => (
                  <tr key={column.index} className="hover:bg-white/[0.02]">
                    <td className="max-w-[180px] truncate px-5 py-2.5 font-medium text-zinc-300" title={column.name}>
                      {column.name}
                    </td>
                    <td className="px-3 py-2.5"><TypeBadge type={column.type} /></td>
                    <td className="px-3 py-2.5 text-right font-mono text-zinc-400">{formatNumber(column.count, 0)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      <span className={column.missing > 0 ? "text-amber-300" : "text-zinc-600"}>
                        {column.missing > 0 ? formatPercent(column.missingPercentage, 0) : "0%"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-zinc-400">{formatNumber(column.unique, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {columns.length > 12 && (
              <div className="border-t border-line px-5 py-2.5 text-center text-[11px] text-zinc-600">
                + {columns.length - 12} more columns
              </div>
            )}
          </div>
        </Panel>
      </div>

      {overview.missingPercentage > 0 && (
        <Panel className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-200">
            <CalendarDays size={16} className="text-amber-400" /> Completeness by column
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analysis.missingByColumn
              .filter((item) => item.missing > 0)
              .slice(0, 9)
              .map((item) => (
                <div key={item.name}>
                  <div className="mb-1.5 flex justify-between gap-2 text-xs">
                    <span className="truncate text-zinc-400" title={item.name}>{item.name}</span>
                    <span className="font-mono text-zinc-500">{formatPercent(item.percentage, 0)} missing</span>
                  </div>
                  <ProgressBar value={100 - item.percentage} tone={item.percentage > 20 ? "rose" : "accent"} />
                </div>
              ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Activity, BarChart3, Columns3, Info, Sigma } from "lucide-react";
import { formatNumber, formatPercent } from "@/lib/format";
import { isNumericType } from "@/types";
import type { Analysis, ColumnAnalysis } from "@/types";
import { BoxPlot, CategoricalBarChart, HistogramChart } from "./charts";
import { Panel, TypeBadge } from "./ui";

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-canvas/50 p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </div>
      <div className="mt-1.5 truncate font-mono text-sm font-medium text-zinc-100" title={value}>
        {value}
      </div>
      {hint && <div className="mt-0.5 truncate text-[10px] text-zinc-600" title={hint}>{hint}</div>}
    </div>
  );
}

export function ColumnAnalysisView({ analysis }: { analysis: Analysis }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const column: ColumnAnalysis | undefined =
    analysis.columns[selectedIndex] ?? analysis.columns[0];

  if (!column) return null;

  const numeric = isNumericType(column.type) && column.numeric;
  const stats = column.numeric;

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <Panel className="h-fit overflow-hidden lg:sticky lg:top-20">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3 text-xs font-medium text-zinc-300">
          <Columns3 size={15} className="text-accent" /> Columns
          <span className="ml-auto font-mono text-zinc-600">{analysis.columns.length}</span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {analysis.columns.map((col) => (
            <button
              key={col.index}
              type="button"
              onClick={() => setSelectedIndex(col.index)}
              className={`group mb-1 w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                col.index === column.index
                  ? "border-accent/30 bg-accent/[0.08]"
                  : "border-transparent hover:border-line hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate text-xs font-medium ${col.index === column.index ? "text-accent" : "text-zinc-300"}`} title={col.name}>
                  {col.name}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-zinc-600">
                  {formatNumber(col.unique, 0)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <TypeBadge type={col.type} />
                {col.missing > 0 && (
                  <span className="text-[10px] text-amber-400/80">
                    {formatPercent(col.missingPercentage, 0)} missing
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </Panel>

      <div className="min-w-0 space-y-5">
        <Panel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="truncate text-lg font-semibold text-white">{column.name}</h3>
                <TypeBadge type={column.type} />
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                <Info size={12} /> Column {column.index + 1} of {analysis.columns.length} · {formatNumber(column.count, 0)} populated values
              </p>
            </div>
            {column.samples.length > 0 && (
              <div className="flex max-w-xs flex-wrap justify-end gap-1.5">
                {column.samples.slice(0, 3).map((sample, i) => (
                  <span key={i} className="pill font-mono text-[10px]" title={sample}>
                    {sample.length > 14 ? `${sample.slice(0, 13)}…` : sample}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            <Metric label="Count" value={formatNumber(column.count, 0)} hint="non-missing cells" />
            <Metric label="Missing" value={formatNumber(column.missing, 0)} hint={formatPercent(column.missingPercentage)} />
            <Metric label="Unique" value={formatNumber(column.unique, 0)} hint="distinct values" />
            {stats && <Metric label="Mean" value={formatNumber(stats.mean, 4)} />}
          </div>
        </Panel>

        {numeric && stats && (
          <>
            <Panel className="p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-200">
                <Sigma size={16} className="text-accent" /> Descriptive statistics
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                <Metric label="Median" value={formatNumber(stats.median, 4)} />
                <Metric label="Mode" value={stats.mode.length ? stats.mode.map((v) => formatNumber(v, 2)).join(", ") : "—"} />
                <Metric label="Min" value={formatNumber(stats.min, 4)} />
                <Metric label="Max" value={formatNumber(stats.max, 4)} />
                <Metric label="Range" value={formatNumber(stats.range, 4)} />
                <Metric label="Std dev" value={formatNumber(stats.stdDev, 4)} hint="sample (n−1)" />
                <Metric label="Variance" value={formatNumber(stats.variance, 4)} />
                <Metric label="Sum" value={formatNumber(stats.sum, 2)} />
                <Metric label="Q1 / 25%" value={formatNumber(stats.q1, 4)} />
                <Metric label="Q2 / 50%" value={formatNumber(stats.q2, 4)} />
                <Metric label="Q3 / 75%" value={formatNumber(stats.q3, 4)} />
                <Metric label="IQR" value={formatNumber(stats.iqr, 4)} hint="Q3 − Q1" />
              </div>
            </Panel>

            <div className="grid gap-5 xl:grid-cols-2">
              <Panel className="p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <BarChart3 size={16} className="text-accent" /> Distribution
                </div>
                <HistogramChart column={column} />
              </Panel>
              <Panel className="p-5">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-200">
                  <Activity size={16} className="text-accent" /> Box plot
                </div>
                {column.boxPlot && <BoxPlot data={column.boxPlot} />}
                <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[11px] sm:grid-cols-5">
                  {[
                    ["Min", column.boxPlot?.min],
                    ["Q1", column.boxPlot?.q1],
                    ["Median", column.boxPlot?.median],
                    ["Q3", column.boxPlot?.q3],
                    ["Max", column.boxPlot?.max],
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-md border border-line bg-canvas/50 py-2">
                      <div className="text-[9px] uppercase tracking-wider text-zinc-600">{label}</div>
                      <div className="mt-1 font-mono text-zinc-300">{formatNumber(value as number, 2)}</div>
                    </div>
                  ))}
                </div>
                {!!column.boxPlot?.outliers.length && (
                  <p className="mt-3 text-[11px] text-rose-300/70">
                    {column.boxPlot.outliers.length} potential outlier{column.boxPlot.outliers.length === 1 ? "" : "s"} outside the IQR fences.
                  </p>
                )}
              </Panel>
            </div>
          </>
        )}

        {column.categorical && (
          <Panel className="p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-200">
              <BarChart3 size={16} className="text-accent" /> Frequency analysis
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Metric
                    label="Most frequent"
                    value={column.categorical.mostFrequent?.value ?? "—"}
                    hint={column.categorical.mostFrequent ? `${formatNumber(column.categorical.mostFrequent.count, 0)} occurrences` : undefined}
                  />
                  <Metric
                    label="Rarest"
                    value={column.categorical.leastFrequent[0]?.value ?? "—"}
                    hint={column.categorical.leastFrequent[0] ? `${formatNumber(column.categorical.leastFrequent[0].count, 0)} occurrences` : undefined}
                  />
                </div>
                <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-line">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-panel2 text-[10px] uppercase tracking-wider text-zinc-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Value</th>
                        <th className="px-3 py-2 text-right font-medium">Count</th>
                        <th className="px-3 py-2 text-right font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {column.categorical.distribution.map((item) => (
                        <tr key={item.value} className="hover:bg-white/[0.02]">
                          <td className="max-w-[160px] truncate px-3 py-2 font-mono text-zinc-300" title={item.value}>{item.value}</td>
                          <td className="px-3 py-2 text-right font-mono text-zinc-400">{item.count}</td>
                          <td className="px-3 py-2 text-right font-mono text-zinc-500">{formatPercent(item.percentage, 1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <CategoricalBarChart column={column} />
              </div>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

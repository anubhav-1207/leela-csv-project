"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Box,
  ChartColumn,
  Grid2X2,
  LineChart,
  PieChart,
  Settings2,
} from "lucide-react";
import { isNumericType } from "@/types";
import type { Analysis } from "@/types";
import {
  BoxPlot,
  CategoricalBarChart,
  CorrelationHeatmap,
  HistogramChart,
  MissingValuesChart,
} from "./charts";
import { EmptyState, Panel, TypeBadge } from "./ui";

type ChartToggle = "histogram" | "box" | "bar" | "correlation" | "missing";

export function VisualizationsView({ analysis }: { analysis: Analysis }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [enabled, setEnabled] = useState<Record<ChartToggle, boolean>>({
    histogram: true,
    box: true,
    bar: true,
    correlation: true,
    missing: true,
  });

  useEffect(() => {
    const numeric = analysis.columns.filter((c) => isNumericType(c.type)).slice(0, 3);
    const categorical = analysis.columns.filter((c) => !isNumericType(c.type)).slice(0, 2);
    setSelected(new Set([...numeric, ...categorical].map((c) => c.index)));
  }, [analysis]);

  const chosen = analysis.columns.filter((c) => selected.has(c.index));
  const numericChosen = chosen.filter((c) => isNumericType(c.type));
  const categoricalChosen = chosen.filter((c) => !isNumericType(c.type));

  function toggleColumn(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const toggles: { key: ChartToggle; label: string; icon: typeof BarChart3 }[] = [
    { key: "histogram", label: "Histograms", icon: ChartColumn },
    { key: "box", label: "Box plots", icon: Box },
    { key: "bar", label: "Bar charts", icon: BarChart3 },
    { key: "correlation", label: "Correlation", icon: Grid2X2 },
    { key: "missing", label: "Missing values", icon: PieChart },
  ];

  return (
    <div className="space-y-5">
      <Panel className="p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-zinc-300">
          <Settings2 size={14} className="text-accent" /> Chart controls
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="label">Columns to visualize</div>
            <div className="flex flex-wrap gap-1.5">
              {analysis.columns.map((column) => (
                <button
                  key={column.index}
                  type="button"
                  onClick={() => toggleColumn(column.index)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors ${
                    selected.has(column.index)
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-line bg-canvas text-zinc-500 hover:text-zinc-300"
                  }`}
                  title={column.name}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isNumericType(column.type) ? "bg-sky-400" : "bg-violet-400"}`} />
                  <span className="max-w-[130px] truncate">{column.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="label">Chart types</div>
            <div className="flex flex-wrap gap-1.5">
              {toggles.map((toggle) => {
                const Icon = toggle.icon;
                const on = enabled[toggle.key];
                return (
                  <button
                    key={toggle.key}
                    type="button"
                    onClick={() => setEnabled((prev) => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors ${
                      on
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-line bg-canvas text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    <Icon size={12} /> {toggle.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Panel>

      {chosen.length === 0 && (
        <EmptyState
          icon={LineChart}
          title="No columns selected"
          description="Pick one or more columns above to generate charts automatically."
        />
      )}

      {enabled.histogram && numericChosen.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
            <ChartColumn size={15} className="text-accent" /> Distributions
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {numericChosen.map((column) => (
              <Panel key={`hist-${column.index}`} className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-zinc-200" title={column.name}>{column.name}</span>
                  <TypeBadge type={column.type} />
                </div>
                <HistogramChart column={column} />
              </Panel>
            ))}
          </div>
        </div>
      )}

      {enabled.box && numericChosen.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Box size={15} className="text-accent" /> Box plots
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {numericChosen.map((column) => (
              <Panel key={`box-${column.index}`} className="p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-zinc-200" title={column.name}>{column.name}</span>
                  {column.boxPlot && column.boxPlot.outliers.length > 0 && (
                    <span className="text-[10px] text-rose-300/70">{column.boxPlot.outliers.length} outliers</span>
                  )}
                </div>
                {column.boxPlot && <BoxPlot data={column.boxPlot} />}
              </Panel>
            ))}
          </div>
        </div>
      )}

      {enabled.bar && categoricalChosen.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
            <BarChart3 size={15} className="text-accent" /> Category frequencies
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {categoricalChosen.map((column) => (
              <Panel key={`bar-${column.index}`} className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-zinc-200" title={column.name}>{column.name}</span>
                  <TypeBadge type={column.type} />
                </div>
                <CategoricalBarChart column={column} />
              </Panel>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {enabled.correlation && analysis.correlations.length > 0 && (
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Grid2X2 size={15} className="text-accent" /> Correlation heatmap
              </h3>
              <span className="text-[10px] text-zinc-600">Pearson r</span>
            </div>
            <CorrelationHeatmap correlations={analysis.correlations} />
          </Panel>
        )}
        {enabled.missing && analysis.overview.missing > 0 && (
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <PieChart size={15} className="text-accent" /> Missing-value distribution
              </h3>
              <span className="text-[10px] text-zinc-600">{analysis.overview.missing} cells</span>
            </div>
            <MissingValuesChart data={analysis.missingByColumn} />
          </Panel>
        )}
      </div>
    </div>
  );
}

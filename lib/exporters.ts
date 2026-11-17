import Papa from "papaparse";
import type { Analysis, Dataset, ParseWarning } from "@/types";

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9\-_]+/gi, "_") || "dataset";
}

export function datasetToCsv(dataset: Dataset): string {
  return Papa.unparse(
    { fields: dataset.columns, data: dataset.rows },
    { newline: "\r\n" }
  );
}

export function downloadCleanedCsv(dataset: Dataset) {
  triggerDownload(
    datasetToCsv(dataset),
    `${baseName(dataset.name)}_cleaned.csv`,
    "text/csv;charset=utf-8"
  );
}

export function buildAnalysisReport(
  dataset: Dataset,
  analysis: Analysis,
  warnings: ParseWarning[] = []
): string {
  const report = {
    meta: {
      tool: "CSV Intelligence",
      generatedAt: new Date().toISOString(),
      sourceFile: dataset.name,
      fileSizeBytes: dataset.size,
    },
    warnings,
    overview: analysis.overview,
    quality: analysis.quality,
    correlations: analysis.correlations,
    columns: analysis.columns.map((column) => ({
      name: column.name,
      type: column.type,
      count: column.count,
      missing: column.missing,
      missingPercentage: Number(column.missingPercentage.toFixed(2)),
      unique: column.unique,
      samples: column.samples,
      numeric: column.numeric
        ? Object.fromEntries(
            Object.entries(column.numeric).map(([key, value]) => [
              key,
              Array.isArray(value)
                ? value
                : typeof value === "number"
                ? Number(value.toFixed(6))
                : value,
            ])
          )
        : null,
      categorical: column.categorical,
      boxPlot: column.boxPlot
        ? {
            ...column.boxPlot,
            outliers: column.boxPlot.outliers,
          }
        : null,
    })),
  };
  return JSON.stringify(report, null, 2);
}

export function downloadAnalysisReport(
  dataset: Dataset,
  analysis: Analysis,
  warnings: ParseWarning[] = []
) {
  triggerDownload(
    buildAnalysisReport(dataset, analysis, warnings),
    `${baseName(dataset.name)}_analysis_report.json`,
    "application/json"
  );
}

export function buildStatisticalSummaryCsv(analysis: Analysis): string {
  const rows: (string | number)[][] = [
    [
      "column",
      "type",
      "count",
      "missing",
      "unique",
      "mean",
      "median",
      "mode",
      "min",
      "max",
      "range",
      "std_dev",
      "variance",
      "q1",
      "q3",
      "iqr",
    ],
  ];
  for (const column of analysis.columns) {
    const n = column.numeric;
    rows.push([
      column.name,
      column.type,
      column.count,
      column.missing,
      column.unique,
      n ? round(n.mean) : "",
      n ? round(n.median) : "",
      n ? n.mode.join("; ") : column.categorical?.mostFrequent?.value ?? "",
      n ? round(n.min) : "",
      n ? round(n.max) : "",
      n ? round(n.range) : "",
      n ? round(n.stdDev) : "",
      n ? round(n.variance) : "",
      n ? round(n.q1) : "",
      n ? round(n.q3) : "",
      n ? round(n.iqr) : "",
    ]);
  }
  return Papa.unparse(rows);
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

export function downloadStatisticalSummary(analysis: Analysis) {
  triggerDownload(
    buildStatisticalSummaryCsv(analysis),
    "statistical_summary.csv",
    "text/csv;charset=utf-8"
  );
}

export function buildQualityCsv(analysis: Analysis): string {
  const rows: (string | number)[][] = [
    ["severity", "check", "title", "affected", "columns", "description"],
  ];
  for (const issue of analysis.quality.issues) {
    rows.push([
      issue.severity,
      issue.type,
      issue.title,
      issue.affected,
      issue.columns.join("; "),
      issue.description,
    ]);
  }
  return Papa.unparse(rows);
}

export function downloadQualityReport(analysis: Analysis) {
  triggerDownload(
    buildQualityCsv(analysis),
    "data_quality_report.csv",
    "text/csv;charset=utf-8"
  );
}

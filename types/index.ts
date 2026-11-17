// ---------------------------------------------------------------------------
// Core dataset representation
// ---------------------------------------------------------------------------

/** A CSV file kept as a rectangular matrix of raw string cells.
 *  Keeping raw strings makes the representation lossless: nothing is silently
 *  coerced or discarded. Empty string is the canonical "empty" cell but the
 *  analysis layer also understands common null tokens (N/A, null, ...). */
export interface Dataset {
  name: string;
  size: number; // original file size in bytes
  columns: string[];
  rows: string[][];
}

export type ColumnType = "integer" | "float" | "string" | "boolean" | "date";

export const NUMERIC_TYPES: ColumnType[] = ["integer", "float"];

export function isNumericType(type: ColumnType): boolean {
  return type === "integer" || type === "float";
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

export interface NumericStats {
  count: number;
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  stdDev: number;
  variance: number;
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
  sum: number;
}

export interface FrequencyItem {
  value: string;
  count: number;
  percentage: number;
}

export interface CategoricalStats {
  unique: number;
  mostFrequent: FrequencyItem | null;
  leastFrequent: FrequencyItem[];
  distribution: FrequencyItem[];
}

export interface HistogramBin {
  start: number;
  end: number;
  count: number;
}

export interface BoxPlotData {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  lowerFence: number;
  upperFence: number;
  outliers: number[];
}

export interface ColumnAnalysis {
  index: number;
  name: string;
  type: ColumnType;
  /** number of non-missing cells */
  count: number;
  missing: number;
  missingPercentage: number;
  unique: number;
  samples: string[];
  numeric: NumericStats | null;
  categorical: CategoricalStats | null;
  histogram: HistogramBin[];
  boxPlot: BoxPlotData | null;
}

export interface Correlation {
  a: string;
  b: string;
  value: number;
}

// ---------------------------------------------------------------------------
// Data quality
// ---------------------------------------------------------------------------

export type Severity = "error" | "warning" | "info";
export type QualityIssueType =
  | "missing-values"
  | "duplicate-rows"
  | "duplicate-columns"
  | "inconsistent-types"
  | "outliers"
  | "empty-column"
  | "constant-column"
  | "ragged-rows";

export interface QualityIssue {
  id: string;
  type: QualityIssueType;
  severity: Severity;
  title: string;
  description: string;
  affected: number;
  columns: string[];
}

export interface QualityReport {
  score: number; // 0..100
  issues: QualityIssue[];
  counts: Record<Severity, number>;
}

// ---------------------------------------------------------------------------
// Full analysis
// ---------------------------------------------------------------------------

export interface DatasetOverview {
  rows: number;
  columns: number;
  cells: number;
  duplicates: number;
  missing: number;
  missingPercentage: number;
  size: number;
  numericColumns: number;
  categoricalColumns: number;
}

export interface Analysis {
  overview: DatasetOverview;
  columns: ColumnAnalysis[];
  quality: QualityReport;
  correlations: Correlation[];
  missingByColumn: { name: string; missing: number; percentage: number }[];
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export interface ParseWarning {
  severity: Severity;
  message: string;
}

export interface ProcessedFile {
  dataset: Dataset;
  analysis: Analysis;
  warnings: ParseWarning[];
}

// ---------------------------------------------------------------------------
// Cleaning
// ---------------------------------------------------------------------------

export type NumericFillStrategy = "mean" | "median" | "zero";
export type CategoricalFillStrategy = "mode" | "custom";

export interface CleaningResult {
  dataset: Dataset;
  changed: number;
  description: string;
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

export type Section =
  | "overview"
  | "preview"
  | "columns"
  | "quality"
  | "visualizations"
  | "cleaning"
  | "export";

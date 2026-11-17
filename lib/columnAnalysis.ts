import type {
  BoxPlotData,
  CategoricalStats,
  ColumnAnalysis,
  ColumnType,
  FrequencyItem,
} from "@/types";
import { isNumericType } from "@/types";
import { histogram, numericStats } from "./statistics";
import {
  detectColumnType,
  isMissing,
  parseBoolean,
  parseNumeric,
} from "./values";

function normalize(value: string, type: ColumnType): string {
  const trimmed = value.trim();
  if (type === "integer" || type === "float") {
    const n = parseNumeric(trimmed);
    return n === null ? trimmed : String(n);
  }
  if (type === "boolean") return String(parseBoolean(trimmed));
  return trimmed;
}

export function analyzeColumn(
  name: string,
  index: number,
  rows: string[][]
): ColumnAnalysis {
  const raw = rows.map((row) => row[index] ?? "");
  const nonMissing = raw.filter((value) => !isMissing(value));
  const missing = raw.length - nonMissing.length;
  const type = detectColumnType(nonMissing);

  const normalized = nonMissing.map((value) => normalize(value, type));
  const unique = new Set(normalized).size;

  // Distinct sample values for quick inspection.
  const samples: string[] = [];
  const seen = new Set<string>();
  for (const value of nonMissing) {
    const trimmed = value.trim();
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      samples.push(trimmed);
    }
    if (samples.length >= 6) break;
  }

  let numeric: ColumnAnalysis["numeric"] = null;
  let categorical: CategoricalStats | null = null;
  let histogramBins: ColumnAnalysis["histogram"] = [];
  let boxPlot: BoxPlotData | null = null;

  if (isNumericType(type)) {
    const numbers = nonMissing
      .map((value) => parseNumeric(value))
      .filter((value): value is number => value !== null);
    const stats = numericStats(numbers);
    numeric = stats;

    histogramBins = histogram(numbers);
    const lowerFence = stats.q1 - 1.5 * stats.iqr;
    const upperFence = stats.q3 + 1.5 * stats.iqr;
    boxPlot = {
      min: stats.min,
      q1: stats.q1,
      median: stats.median,
      q3: stats.q3,
      max: stats.max,
      lowerFence,
      upperFence,
      outliers: numbers.filter((v) => v < lowerFence || v > upperFence),
    };
  } else {
    const counts = new Map<string, number>();
    for (const value of normalized) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    const distribution: FrequencyItem[] = [...counts.entries()]
      .map(([value, count]) => ({
        value,
        count,
        percentage: nonMissing.length ? (count / nonMissing.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    const maxCount = distribution[0]?.count ?? 0;
    const minCount = distribution[distribution.length - 1]?.count ?? 0;
    categorical = {
      unique,
      mostFrequent: distribution[0] ?? null,
      leastFrequent: distribution
        .filter((item) => item.count === minCount && item.count < maxCount)
        .slice(0, 5),
      distribution: distribution.slice(0, 20),
    };
  }

  return {
    index,
    name,
    type,
    count: nonMissing.length,
    missing,
    missingPercentage: raw.length ? (missing / raw.length) * 100 : 0,
    unique,
    samples,
    numeric,
    categorical,
    histogram: histogramBins,
    boxPlot,
  };
}

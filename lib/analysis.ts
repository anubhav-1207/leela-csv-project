import type { Analysis, Dataset, DatasetOverview } from "@/types";
import { isNumericType } from "@/types";
import { analyzeColumn } from "./columnAnalysis";
import { buildQualityReport } from "./dataQuality";
import { pearson } from "./statistics";
import { isMissing, parseNumeric } from "./values";

function countDuplicateRows(dataset: Dataset): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const row of dataset.rows) {
    const key = row.join("\u0000");
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);
  }
  return duplicates;
}

/** Compute the complete analysis for a dataset in a single pass over columns. */
export function analyzeDataset(dataset: Dataset): Analysis {
  const columns = dataset.columns.map((name, index) =>
    analyzeColumn(name, index, dataset.rows)
  );

  const numericColumns = columns.filter((c) => isNumericType(c.type));
  const totalMissing = columns.reduce((acc, c) => acc + c.missing, 0);
  const cells = dataset.rows.length * dataset.columns.length;

  const overview: DatasetOverview = {
    rows: dataset.rows.length,
    columns: dataset.columns.length,
    cells,
    duplicates: countDuplicateRows(dataset),
    missing: totalMissing,
    missingPercentage: cells ? (totalMissing / cells) * 100 : 0,
    size: dataset.size,
    numericColumns: numericColumns.length,
    categoricalColumns: columns.length - numericColumns.length,
  };

  const quality = buildQualityReport(dataset, columns);

  // Correlations between numeric columns. Cap the number of columns so that a
  // very wide file cannot make this step quadratic and block the UI.
  const pairs: Analysis["correlations"] = [];
  const considered = numericColumns.slice(0, 16);
  for (let i = 0; i < considered.length; i++) {
    for (let j = i + 1; j < considered.length; j++) {
      const a = considered[i];
      const b = considered[j];
      const av: number[] = [];
      const bv: number[] = [];
      for (const row of dataset.rows) {
        const rawA = row[a.index] ?? "";
        const rawB = row[b.index] ?? "";
        if (isMissing(rawA) || isMissing(rawB)) continue;
        const na = parseNumeric(rawA);
        const nb = parseNumeric(rawB);
        if (na === null || nb === null) continue;
        av.push(na);
        bv.push(nb);
      }
      if (av.length < 2) continue;
      pairs.push({ a: a.name, b: b.name, value: pearson(av, bv) });
    }
  }

  const missingByColumn = columns.map((c) => ({
    name: c.name,
    missing: c.missing,
    percentage: c.missingPercentage,
  }));

  return { overview, columns, quality, correlations: pairs, missingByColumn };
}

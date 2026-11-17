import type {
  ColumnAnalysis,
  Dataset,
  QualityIssue,
  QualityReport,
  Severity,
} from "@/types";
import { isNumericType } from "@/types";
import { outlierIndices } from "./statistics";
import { isMissing, parseNumeric } from "./values";

function rowKey(row: string[]): string {
  return row.join("\u0000");
}

export function buildQualityReport(
  dataset: Dataset,
  columns: ColumnAnalysis[]
): QualityReport {
  const issues: QualityIssue[] = [];
  const rowCount = dataset.rows.length;
  const cellCount = rowCount * dataset.columns.length;

  // --- Missing values -------------------------------------------------------
  const totalMissing = columns.reduce((acc, c) => acc + c.missing, 0);
  if (totalMissing > 0) {
    const pct = cellCount ? (totalMissing / cellCount) * 100 : 0;
    issues.push({
      id: "missing-values",
      type: "missing-values",
      severity: pct >= 20 ? "error" : "warning",
      title: `${totalMissing.toLocaleString()} missing ${
        totalMissing === 1 ? "value" : "values"
      }`,
      description: `${pct.toFixed(1)}% of all cells are empty or use a null token (N/A, null, –). Missing values can skew averages and charts.`,
      affected: totalMissing,
      columns: columns.filter((c) => c.missing > 0).map((c) => c.name),
    });
  }

  // --- Duplicate rows -------------------------------------------------------
  const seen = new Set<string>();
  let duplicateRows = 0;
  for (const row of dataset.rows) {
    const key = rowKey(row);
    if (seen.has(key)) duplicateRows += 1;
    else seen.add(key);
  }
  if (duplicateRows > 0) {
    issues.push({
      id: "duplicate-rows",
      type: "duplicate-rows",
      severity: duplicateRows / Math.max(1, rowCount) >= 0.1 ? "error" : "warning",
      title: `${duplicateRows.toLocaleString()} duplicate ${
        duplicateRows === 1 ? "row" : "rows"
      }`,
      description:
        "These rows are exact copies of an earlier row. They can over-weight results and inflate record counts.",
      affected: duplicateRows,
      columns: [],
    });
  }

  // --- Duplicate column names ----------------------------------------------
  const nameCounts = new Map<string, number>();
  for (const name of dataset.columns) {
    const key = name.trim().toLowerCase();
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
  }
  const duplicateNames = [...nameCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name);
  if (duplicateNames.length) {
    issues.push({
      id: "duplicate-columns",
      type: "duplicate-columns",
      severity: "warning",
      title: `${duplicateNames.length} duplicate column ${
        duplicateNames.length === 1 ? "name" : "names"
      }`,
      description: `The names ${duplicateNames
        .map((n) => `"${n}"`)
        .join(", ")} appear more than once. Rename them to avoid ambiguity.`,
      affected: duplicateNames.length,
      columns: dataset.columns.filter((c) =>
        duplicateNames.includes(c.trim().toLowerCase())
      ),
    });
  }

  // --- Inconsistent data types ---------------------------------------------
  const inconsistentColumns: string[] = [];
  let inconsistentCount = 0;
  for (let i = 0; i < dataset.columns.length; i++) {
    const values = dataset.rows.map((r) => r[i] ?? "").filter((v) => !isMissing(v));
    if (!values.length) continue;
    const numeric = values.filter((v) => parseNumeric(v) !== null).length;
    const other = values.length - numeric;
    const col = columns[i];
    if (
      numeric > 0 &&
      other > 0 &&
      col &&
      !isNumericType(col.type) &&
      col.type !== "boolean"
    ) {
      inconsistentColumns.push(col.name);
      inconsistentCount += other;
    }
  }
  if (inconsistentColumns.length) {
    issues.push({
      id: "inconsistent-types",
      type: "inconsistent-types",
      severity: "warning",
      title: `${inconsistentColumns.length} column${
        inconsistentColumns.length === 1 ? "" : "s"
      } with mixed types`,
      description: `These columns mix numeric and non-numeric values (${inconsistentCount.toLocaleString()} cells). Standardise them before analysis for reliable statistics.`,
      affected: inconsistentCount,
      columns: inconsistentColumns,
    });
  }

  // --- Outliers (IQR) -------------------------------------------------------
  const outlierColumns: string[] = [];
  let outlierCount = 0;
  for (const col of columns) {
    if (!isNumericType(col.type) || !col.numeric) continue;
    const numbers = dataset.rows
      .map((r) => parseNumeric(r[col.index] ?? ""))
      .filter((v): v is number => v !== null);
    const outliers = outlierIndices(numbers);
    if (outliers.length) {
      outlierColumns.push(col.name);
      outlierCount += outliers.length;
    }
  }
  if (outlierCount > 0) {
    issues.push({
      id: "outliers",
      type: "outliers",
      severity: "info",
      title: `${outlierCount.toLocaleString()} potential ${
        outlierCount === 1 ? "outlier" : "outliers"
      }`,
      description:
        "Values outside 1.5 × IQR from the quartiles are statistically unusual, not necessarily wrong. Review them before cleaning.",
      affected: outlierCount,
      columns: outlierColumns,
    });
  }

  // --- Empty / constant columns --------------------------------------------
  const emptyColumns = columns.filter((c) => c.count === 0).map((c) => c.name);
  if (emptyColumns.length) {
    issues.push({
      id: "empty-columns",
      type: "empty-column",
      severity: "warning",
      title: `${emptyColumns.length} empty ${
        emptyColumns.length === 1 ? "column" : "columns"
      }`,
      description: "These columns contain no usable values and add no information.",
      affected: emptyColumns.length,
      columns: emptyColumns,
    });
  }

  const constantColumns = columns
    .filter((c) => c.count > 0 && c.unique === 1)
    .map((c) => c.name);
  if (constantColumns.length) {
    issues.push({
      id: "constant-columns",
      type: "constant-column",
      severity: "info",
      title: `${constantColumns.length} constant ${
        constantColumns.length === 1 ? "column" : "columns"
      }`,
      description:
        "Every populated cell holds the same value. Constant columns usually carry no predictive signal.",
      affected: constantColumns.length,
      columns: constantColumns,
    });
  }

  // --- Score ----------------------------------------------------------------
  const weights: Record<Severity, number> = { error: 12, warning: 5, info: 1 };
  const counts: Record<Severity, number> = { error: 0, warning: 0, info: 0 };
  for (const issue of issues) counts[issue.severity] += 1;
  let penalty = issues.reduce((acc, issue) => acc + weights[issue.severity], 0);
  const missingPct = cellCount ? (totalMissing / cellCount) * 100 : 0;
  penalty += Math.min(20, missingPct * 0.4);
  penalty += Math.min(10, (duplicateRows / Math.max(1, rowCount)) * 20);
  const score = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  return { score, issues, counts };
}

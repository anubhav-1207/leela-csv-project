import type {
  CategoricalFillStrategy,
  CleaningResult,
  ColumnType,
  Dataset,
  NumericFillStrategy,
} from "@/types";
import { isNumericType } from "@/types";
import { analyzeColumn } from "./columnAnalysis";
import { mean, median } from "./statistics";
import {
  detectDatePattern,
  isBooleanString,
  isMissing,
  parseBoolean,
  parseDateWithPattern,
  parseNumeric,
} from "./values";

function clone(dataset: Dataset, changes: Partial<Dataset>): Dataset {
  return { ...dataset, ...changes };
}

function numString(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return String(Math.round(value * 1e6) / 1e6);
}

export function removeDuplicateRows(dataset: Dataset): CleaningResult {
  const seen = new Set<string>();
  const rows: string[][] = [];
  for (const row of dataset.rows) {
    const key = row.join("\u0000");
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push([...row]);
  }
  const changed = dataset.rows.length - rows.length;
  return {
    dataset: clone(dataset, { rows }),
    changed,
    description: `Removed ${changed} duplicate ${changed === 1 ? "row" : "rows"}.`,
  };
}

export function removeEmptyRows(dataset: Dataset): CleaningResult {
  const rows = dataset.rows.filter((row) =>
    row.some((cell) => !isMissing(cell))
  );
  const changed = dataset.rows.length - rows.length;
  return {
    dataset: clone(dataset, { rows: rows.map((row) => [...row]) }),
    changed,
    description: `Removed ${changed} empty ${changed === 1 ? "row" : "rows"}.`,
  };
}

export function fillMissingNumeric(
  dataset: Dataset,
  strategy: NumericFillStrategy
): CleaningResult {
  const rows = dataset.rows.map((row) => [...row]);
  let changed = 0;
  let columnCount = 0;

  for (let i = 0; i < dataset.columns.length; i++) {
    const analysis = analyzeColumn(dataset.columns[i], i, dataset.rows);
    if (!isNumericType(analysis.type)) continue;
    columnCount += 1;

    const values = dataset.rows
      .map((row) => parseNumeric(row[i] ?? ""))
      .filter((value): value is number => value !== null);
    if (!values.length && strategy !== "zero") continue;

    const fill =
      strategy === "zero"
        ? 0
        : strategy === "mean"
        ? mean(values)
        : median(values);
    const fillText = numString(fill);

    for (const row of rows) {
      if (isMissing(row[i] ?? "")) {
        row[i] = fillText;
        changed += 1;
      }
    }
  }

  return {
    dataset: clone(dataset, { rows }),
    changed,
    description: `Filled ${changed} missing numeric ${
      changed === 1 ? "cell" : "cells"
    } across ${columnCount} numeric ${
      columnCount === 1 ? "column" : "columns"
    } using ${strategy}.`,
  };
}

export function fillMissingCategorical(
  dataset: Dataset,
  strategy: CategoricalFillStrategy,
  customValue: string
): CleaningResult {
  if (strategy === "custom" && customValue.trim() === "") {
    return {
      dataset,
      changed: 0,
      description: "Enter a custom fill value first.",
    };
  }

  const rows = dataset.rows.map((row) => [...row]);
  let changed = 0;

  for (let i = 0; i < dataset.columns.length; i++) {
    const analysis = analyzeColumn(dataset.columns[i], i, dataset.rows);
    if (isNumericType(analysis.type)) continue;

    let fillText = customValue.trim();
    if (strategy === "mode" && analysis.categorical?.mostFrequent) {
      fillText = analysis.categorical.mostFrequent.value;
    }
    if (!fillText) continue;

    for (const row of rows) {
      if (isMissing(row[i] ?? "")) {
        row[i] = fillText;
        changed += 1;
      }
    }
  }

  return {
    dataset: clone(dataset, { rows }),
    changed,
    description: `Filled ${changed} missing categorical ${
      changed === 1 ? "cell" : "cells"
    } using ${strategy === "mode" ? "the most frequent value" : `"${customValue.trim()}"`}.`,
  };
}

export function removeColumns(
  dataset: Dataset,
  indices: number[]
): CleaningResult {
  const toRemove = new Set(indices);
  if (!toRemove.size) {
    return { dataset, changed: 0, description: "No columns selected." };
  }
  const keptIndices = dataset.columns
    .map((_, i) => i)
    .filter((i) => !toRemove.has(i));
  const columns = keptIndices.map((i) => dataset.columns[i]);
  const rows = dataset.rows.map((row) => keptIndices.map((i) => row[i] ?? ""));
  const names = indices.map((i) => dataset.columns[i]).join(", ");
  return {
    dataset: clone(dataset, { columns, rows }),
    changed: toRemove.size,
    description: `Removed ${toRemove.size} ${toRemove.size === 1 ? "column" : "columns"}: ${names}.`,
  };
}

export function renameColumn(
  dataset: Dataset,
  index: number,
  newName: string
): CleaningResult {
  const trimmed = newName.trim();
  if (!trimmed || index < 0 || index >= dataset.columns.length) {
    return { dataset, changed: 0, description: "Enter a valid column name." };
  }
  const oldName = dataset.columns[index];
  const columns = [...dataset.columns];
  columns[index] = trimmed;
  return {
    dataset: clone(dataset, { columns }),
    changed: oldName === trimmed ? 0 : 1,
    description: `Renamed "${oldName}" to "${trimmed}".`,
  };
}

export function changeColumnType(
  dataset: Dataset,
  index: number,
  target: ColumnType
): CleaningResult {
  if (index < 0 || index >= dataset.columns.length) {
    return { dataset, changed: 0, description: "Select a column first." };
  }
  const raw = dataset.rows.map((row) => row[index] ?? "");
  let pattern: ReturnType<typeof detectDatePattern> = null;
  if (target === "date") pattern = detectDatePattern(raw.filter((v) => !isMissing(v)));

  let converted = 0;
  let unconverted = 0;
  const rows = dataset.rows.map((row) => {
    const next = [...row];
    const value = row[index] ?? "";
    if (isMissing(value)) return next;

    let result: string | null = null;
    if (target === "integer") {
      const n = parseNumeric(value);
      if (n !== null) result = String(Math.round(n));
    } else if (target === "float") {
      const n = parseNumeric(value);
      if (n !== null) result = numString(n);
    } else if (target === "boolean") {
      if (isBooleanString(value)) result = String(parseBoolean(value));
      else if (parseNumeric(value) === 0 || parseNumeric(value) === 1) {
        result = String(parseNumeric(value) === 1);
      }
    } else if (target === "date") {
      if (pattern) {
        const timestamp = parseDateWithPattern(value, pattern);
        if (timestamp !== null) {
          result = new Date(timestamp).toISOString().slice(0, 10);
        }
      }
    } else {
      result = value.trim();
    }

    if (result === null) unconverted += 1;
    else {
      next[index] = result;
      converted += 1;
    }
    return next;
  });

  const name = dataset.columns[index];
  const note = unconverted
    ? ` ${unconverted} ${unconverted === 1 ? "value" : "values"} could not be converted and were left unchanged.`
    : "";
  return {
    dataset: clone(dataset, { rows }),
    changed: converted,
    description: `Converted ${converted} values in "${name}" to ${target}.${note}`,
  };
}

import Papa from "papaparse";
import type { Dataset, ParseWarning } from "@/types";

export interface ParsedCsv {
  dataset: Dataset;
  warnings: ParseWarning[];
}

/**
 * Parse raw CSV text into a lossless rectangular Dataset.
 * We parse with `header: false` so that duplicate / empty column names and
 * ragged rows can be detected instead of being silently overwritten by the
 * CSV library.
 */
export function parseCsvText(text: string, name: string, size: number): ParsedCsv {
  const warnings: ParseWarning[] = [];
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  if (!clean.trim()) {
    throw new Error("This file is empty. Choose a CSV file that contains data.");
  }

  const result = Papa.parse<string[]>(clean, {
    // `true` skips only truly blank lines. "greedy" would also drop rows made
    // entirely of delimiters (",,") — those are real empty rows and must be
    // preserved so the quality/cleaning layers can detect them.
    skipEmptyLines: true,
    delimiter: "", // auto-detect
  });

  if (result.errors.length && !result.data.length) {
    const first = result.errors[0];
    throw new Error(`Could not parse this CSV: ${first.message}`);
  }

  const matrix = result.data;
  if (!matrix.length) {
    throw new Error("No readable rows were found in this file.");
  }

  if (result.errors.length) {
    warnings.push({
      severity: "warning",
      message: `${result.errors.length} parsing ${
        result.errors.length === 1 ? "warning" : "warnings"
      } were reported (for example, inconsistent field counts).`,
    });
  }

  // --- Build the header row -------------------------------------------------
  const rawHeader = matrix[0];
  const headerWidth = rawHeader.length;
  const usedNames = new Map<string, number>();
  const columns: string[] = rawHeader.map((cell, index) => {
    let header = cell.trim();
    if (!header) {
      warnings.push({
        severity: "info",
        message: `Column ${index + 1} had no name and was named "Column ${index + 1}".`,
      });
      header = `Column ${index + 1}`;
    }
    // Duplicate names are intentionally preserved so the data-quality engine
    // can detect and report them. All analysis is keyed by column index.
    const lower = header.toLowerCase();
    const seen = usedNames.get(lower) ?? 0;
    if (seen > 0) {
      warnings.push({
        severity: "warning",
        message: `Duplicate column name "${header}" found at position ${index + 1}. It is flagged in Data Quality.`,
      });
    }
    usedNames.set(lower, seen + 1);
    return header;
  });

  // --- Build data rows ------------------------------------------------------
  let maxWidth = columns.length;
  for (let i = 1; i < matrix.length; i++) {
    if (matrix[i].length > maxWidth) maxWidth = matrix[i].length;
  }

  if (maxWidth > columns.length) {
    warnings.push({
      severity: "warning",
      message: `${maxWidth - columns.length} unnamed ${
        maxWidth - columns.length === 1 ? "column was" : "columns were"
      } added because some rows had more fields than the header.`,
    });
    for (let i = columns.length; i < maxWidth; i++) {
      columns.push(`Column ${i + 1}`);
    }
  }

  let ragged = 0;
  const rows: string[][] = [];
  for (let i = 1; i < matrix.length; i++) {
    const source = matrix[i];
    if (source.length !== headerWidth) ragged += 1;
    const row = new Array<string>(columns.length);
    for (let j = 0; j < columns.length; j++) {
      row[j] = source[j] !== undefined ? source[j] : "";
    }
    rows.push(row);
  }

  if (ragged > 0) {
    warnings.push({
      severity: "warning",
      message: `${ragged} ${ragged === 1 ? "row has" : "rows have"} a different number of fields than the header. Missing cells were treated as empty.`,
    });
  }

  if (rows.length === 0) {
    warnings.push({
      severity: "info",
      message: "The file contains a header but no data rows.",
    });
  }

  return {
    dataset: { name, size, columns, rows },
    warnings,
  };
}

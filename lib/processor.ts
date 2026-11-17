import type { Analysis, Dataset, ProcessedFile } from "@/types";
import { analyzeDataset } from "./analysis";
import { parseCsvText } from "./csv";

/** Parse + analyse raw CSV text. Shared by the Web Worker and the fallback. */
export function processText(
  text: string,
  name: string,
  size: number
): ProcessedFile {
  const { dataset, warnings } = parseCsvText(text, name, size);
  return { dataset, analysis: analyzeDataset(dataset), warnings };
}

/** Re-analysis of an existing (already cleaned) dataset. */
export function analyzeOnly(dataset: Dataset): Analysis {
  return analyzeDataset(dataset);
}

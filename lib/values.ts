import type { ColumnType } from "@/types";

/** Tokens that represent a missing value in real-world CSV exports. */
export const MISSING_TOKENS = new Set([
  "",
  "na",
  "n/a",
  "n.a.",
  "null",
  "none",
  "nan",
  "nil",
  "-",
  "--",
  "?",
  "#n/a",
  "#na",
]);

export function isMissing(value: string): boolean {
  return MISSING_TOKENS.has(value.trim().toLowerCase());
}

const THOUSANDS = /^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/;
const PLAIN_NUMBER = /^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/;
const INTEGER_LIKE = /^[+-]?\d+$/;
const BOOL_TOKENS = new Set(["true", "false", "yes", "no", "t", "f", "y", "n"]);

/** Parse a numeric-looking string. Returns null when it is not numeric. */
export function parseNumeric(value: string): number | null {
  let s = value.trim();
  if (!s) return null;
  if (THOUSANDS.test(s)) s = s.replace(/,/g, "");
  else if (!PLAIN_NUMBER.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function isIntegerString(value: string): boolean {
  const s = value.trim();
  return INTEGER_LIKE.test(s) || (THOUSANDS.test(s) && !s.includes("."));
}

export function isBooleanString(value: string): boolean {
  return BOOL_TOKENS.has(value.trim().toLowerCase());
}

export function parseBoolean(value: string): boolean {
  return ["true", "yes", "t", "y"].includes(value.trim().toLowerCase());
}

type DatePattern = "iso" | "ymd" | "dmy" | "mdy" | "named";

const ISO_RE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
const NUMERIC_DATE_RE = /^(\d{1,4})[\/\-.](\d{1,2})[\/\-.](\d{1,4})(?:[ T]\d{1,2}:\d{2}(?::\d{2})?)?$/;
const MONTHS = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*$/i;
const NAMED_RE = /^([a-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/i;
const NAMED_RE_2 = /^(\d{1,2})\s+([a-z]{3,9})\.?\s+(\d{4})$/i;

function monthIndex(month: string): number {
  const key = month.slice(0, 3).toLowerCase();
  return MONTHS.test(key) ? ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].indexOf(key) : -1;
}

function validDate(y: number, m: number, d: number): number | null {
  if (y < 100 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date.getTime();
}

/** Parse a date for a known pattern. */
export function parseDateWithPattern(
  value: string,
  pattern: DatePattern
): number | null {
  const s = value.trim();
  if (pattern === "iso") {
    if (!ISO_RE.test(s)) return null;
    const [datePart] = s.split(/[T ]/);
    const [y, m, d] = datePart.split("-").map(Number);
    return validDate(y, m, d);
  }
  if (pattern === "named") {
    let match = NAMED_RE.exec(s);
    if (match) return validDate(Number(match[3]), monthIndex(match[1]) + 1, Number(match[2]));
    match = NAMED_RE_2.exec(s);
    if (match) return validDate(Number(match[3]), monthIndex(match[2]) + 1, Number(match[1]));
    return null;
  }
  const match = NUMERIC_DATE_RE.exec(s);
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  const c = Number(match[3]);
  if (pattern === "ymd") return validDate(a, b, c);
  if (pattern === "dmy") return validDate(c, b, a);
  return validDate(c, a, b); // mdy
}

/** Infer a consistent date pattern for a column, or null. */
export function detectDatePattern(values: string[]): DatePattern | null {
  if (!values.length) return null;
  const candidates: DatePattern[] = ["iso", "named", "ymd", "dmy", "mdy"];
  for (const pattern of candidates) {
    let parsed = 0;
    for (const value of values) {
      if (parseDateWithPattern(value, pattern) !== null) parsed += 1;
    }
    // Require almost all non-empty values to parse with the same pattern so
    // that arbitrary numbers / codes are not misclassified as dates.
    if (parsed / values.length >= 0.95) return pattern;
  }
  return null;
}

/** Detect the type of a column from its non-missing values. */
export function detectColumnType(nonMissing: string[]): ColumnType {
  if (!nonMissing.length) return "string";
  if (nonMissing.every(isBooleanString)) return "boolean";
  if (nonMissing.every(isIntegerString)) return "integer";
  if (nonMissing.every((v) => parseNumeric(v) !== null)) return "float";
  if (detectDatePattern(nonMissing) !== null) return "date";
  return "string";
}

/** Convert a raw cell to a numeric value given the column's detected type. */
export function toNumeric(value: string): number | null {
  if (isMissing(value)) return null;
  return parseNumeric(value);
}

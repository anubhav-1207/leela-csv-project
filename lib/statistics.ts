import type { HistogramBin, NumericStats } from "@/types";

/** Guard against non-finite values produced by degenerate input. */
function safe(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

export function sum(values: number[]): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

export function mean(values: number[]): number {
  return values.length ? safe(sum(values) / values.length) : 0;
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Linear-interpolation percentile (R-7 / numpy default). */
export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * Math.min(1, Math.max(0, p));
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const fraction = position - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction;
}

export function mode(values: number[]): number[] {
  if (!values.length) return [];
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let max = 0;
  for (const c of counts.values()) if (c > max) max = c;
  if (max <= 1) return [];
  return [...counts.entries()]
    .filter(([, c]) => c === max)
    .map(([v]) => v)
    .sort((a, b) => a - b);
}

export function variance(values: number[], sample = true): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  let acc = 0;
  for (const v of values) acc += (v - avg) ** 2;
  return safe(acc / (values.length - (sample ? 1 : 0)));
}

export function stdDev(values: number[], sample = true): number {
  return Math.sqrt(variance(values, sample));
}

/** Min/max without argument spread, which overflows the stack on large files. */
function extents(values: number[]): [number, number] {
  if (!values.length) return [0, 0];
  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }
  return [min, max];
}

export function numericStats(values: number[]): NumericStats {
  const q1 = percentile(values, 0.25);
  const q3 = percentile(values, 0.75);
  const [min, max] = extents(values);
  return {
    count: values.length,
    mean: mean(values),
    median: median(values),
    mode: mode(values),
    min,
    max,
    range: max - min,
    stdDev: stdDev(values),
    variance: variance(values),
    q1,
    q2: median(values),
    q3,
    iqr: q3 - q1,
    sum: sum(values),
  };
}

/** Returns index positions of values outside the 1.5*IQR fences. */
export function outlierIndices(values: number[]): number[] {
  if (values.length < 4) return [];
  const q1 = percentile(values, 0.25);
  const q3 = percentile(values, 0.75);
  const iqr = q3 - q1;
  if (iqr === 0) return [];
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  const result: number[] = [];
  values.forEach((v, i) => {
    if (v < low || v > high) result.push(i);
  });
  return result;
}

/** Build histogram bins. Uses Freedman–Diaconis with a Sturges fallback and
 *  clamps the result to a readable number of bars. */
export function histogram(values: number[], maxBins = 30): HistogramBin[] {
  if (!values.length) return [];
  const [min, max] = extents(values);
  if (min === max) {
    return [{ start: min, end: max, count: values.length }];
  }
  const q1 = percentile(values, 0.25);
  const q3 = percentile(values, 0.75);
  const iqr = q3 - q1;
  const n = values.length;
  let width = 0;
  if (iqr > 0) {
    width = (2 * iqr) / Math.cbrt(n);
  }
  let bins = width > 0 ? Math.ceil((max - min) / width) : 0;
  if (!Number.isFinite(bins) || bins < 5) {
    bins = Math.ceil(Math.log2(n)) + 1;
  }
  bins = Math.max(5, Math.min(maxBins, bins));
  width = (max - min) / bins;

  const counts = new Array<number>(bins).fill(0);
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx < 0) idx = 0;
    if (idx >= bins) idx = bins - 1;
    counts[idx] += 1;
  }
  return counts.map((count, i) => ({
    start: min + i * width,
    end: min + (i + 1) * width,
    count,
  }));
}

/** Pearson correlation. Returns 0 for degenerate (zero-variance) inputs. */
export function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  let sa = 0;
  let sb = 0;
  for (let i = 0; i < n; i++) {
    sa += a[i];
    sb += b[i];
  }
  const ma = sa / n;
  const mb = sb / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma;
    const xb = b[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  if (da === 0 || db === 0) return 0;
  return safe(num / Math.sqrt(da * db));
}

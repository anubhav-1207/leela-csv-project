"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  BoxPlotData,
  ColumnAnalysis,
  Correlation,
} from "@/types";
import { formatCompact, formatNumber } from "@/lib/format";

const AXIS = { stroke: "#2a303c", tickLine: false, axisLine: false };
const TOOLTIP_STYLE = {
  backgroundColor: "#12151b",
  border: "1px solid #2a303c",
  borderRadius: "10px",
  fontSize: "12px",
  color: "#e7e9ee",
};

export function HistogramChart({ column }: { column: ColumnAnalysis }) {
  const data = column.histogram.map((bin, index) => ({
    index,
    label: `${formatNumber(bin.start, 1)}–${formatNumber(bin.end, 1)}`,
    count: bin.count,
  }));
  if (!data.length) return null;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
          <CartesianGrid vertical={false} stroke="#1c212a" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            {...AXIS}
            interval="preserveStartEnd"
            minTickGap={24}
            tick={{ fontSize: 10, fill: "#6b7280" }}
          />
          <YAxis
            {...AXIS}
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "#6b7280" }}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            formatter={(value) => [`${value} rows`, "Count"]}
            labelStyle={{ color: "#9ca3af" }}
          />
          <Bar dataKey="count" fill="#2dd4bf" fillOpacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoricalBarChart({ column }: { column: ColumnAnalysis }) {
  const data = (column.categorical?.distribution ?? []).slice(0, 10);
  if (!data.length) return null;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        >
          <CartesianGrid horizontal={false} stroke="#1c212a" strokeDasharray="3 3" />
          <XAxis
            type="number"
            {...AXIS}
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "#6b7280" }}
          />
          <YAxis
            type="category"
            dataKey="value"
            width={96}
            {...AXIS}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickFormatter={(value: string) =>
              value.length > 14 ? `${value.slice(0, 13)}…` : value
            }
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            formatter={(value) => [`${value} rows`, "Count"]}
          />
          <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={18}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? "#2dd4bf" : "#5b8fb9"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MissingValuesChart({
  data,
}: {
  data: { name: string; missing: number; percentage: number }[];
}) {
  const rows = data.filter((d) => d.missing > 0).slice(0, 16);
  if (!rows.length) return null;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 20, bottom: 4, left: 4 }}
        >
          <CartesianGrid horizontal={false} stroke="#1c212a" strokeDasharray="3 3" />
          <XAxis
            type="number"
            {...AXIS}
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "#6b7280" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={96}
            {...AXIS}
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickFormatter={(value: string) =>
              value.length > 14 ? `${value.slice(0, 13)}…` : value
            }
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            formatter={(value, _name, item) => [
              `${value} (${(item?.payload as { percentage: number })?.percentage.toFixed(1)}%)`,
              "Missing",
            ]}
          />
          <Bar dataKey="missing" fill="#fbbf24" fillOpacity={0.85} radius={[0, 3, 3, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Custom SVG box-and-whisker. Recharts has no native box plot, so we draw a
 *  precise, responsive one from the computed five-number summary. */
export function BoxPlot({ data }: { data: BoxPlotData }) {
  const width = 480;
  const height = 120;
  const pad = 28;
  const all = [data.min, data.max, ...data.outliers];
  let low = Math.min(...all);
  let high = Math.max(...all);
  if (low === high) {
    low -= 1;
    high += 1;
  }
  const span = high - low || 1;
  const x = (value: number) => pad + ((value - low) / span) * (width - pad * 2);
  const y = height / 2;
  const boxTop = y - 20;
  const boxHeight = 40;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Box plot"
    >
      {/* whisker */}
      <line x1={x(data.min)} x2={x(data.max)} y1={y} y2={y} stroke="#5b6473" strokeWidth={2} />
      <line x1={x(data.min)} x2={x(data.min)} y1={y - 10} y2={y + 10} stroke="#5b6473" strokeWidth={2} />
      <line x1={x(data.max)} x2={x(data.max)} y1={y - 10} y2={y + 10} stroke="#5b6473" strokeWidth={2} />
      {/* box */}
      <rect
        x={x(data.q1)}
        y={boxTop}
        width={Math.max(2, x(data.q3) - x(data.q1))}
        height={boxHeight}
        fill="rgba(45,212,191,0.12)"
        stroke="#2dd4bf"
        strokeWidth={1.5}
        rx={3}
      />
      {/* median */}
      <line x1={x(data.median)} x2={x(data.median)} y1={boxTop} y2={boxTop + boxHeight} stroke="#5eead4" strokeWidth={2.5} />
      {/* outliers */}
      {data.outliers.slice(0, 60).map((value, i) => (
        <circle key={i} cx={x(value)} cy={y} r={3} fill="#fb7185" fillOpacity={0.8} />
      ))}
      {/* labels */}
      <text x={x(data.min)} y={height - 8} fill="#6b7280" fontSize={10} textAnchor="middle">
        {formatCompact(data.min)}
      </text>
      <text x={x(data.median)} y={boxTop - 8} fill="#9ca3af" fontSize={10} textAnchor="middle">
        median {formatCompact(data.median)}
      </text>
      <text x={x(data.max)} y={height - 8} fill="#6b7280" fontSize={10} textAnchor="middle">
        {formatCompact(data.max)}
      </text>
    </svg>
  );
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${mix(r1, r2)},${mix(g1, g2)},${mix(b1, b2)})`;
}

function correlationColor(value: number): string {
  return value >= 0
    ? lerpColor("#161d22", "#2dd4bf", Math.abs(value))
    : lerpColor("#161d22", "#fb7185", Math.abs(value));
}

export function CorrelationHeatmap({
  correlations,
}: {
  correlations: Correlation[];
}) {
  const names: string[] = [];
  for (const c of correlations) {
    if (!names.includes(c.a)) names.push(c.a);
    if (!names.includes(c.b)) names.push(c.b);
  }
  const display = names.slice(0, 12);
  const lookup = new Map<string, number>();
  for (const c of correlations) {
    lookup.set(`${c.a}|${c.b}`, c.value);
    lookup.set(`${c.b}|${c.a}`, c.value);
  }
  if (display.length < 2) return null;

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[420px] gap-1"
        style={{
          gridTemplateColumns: `minmax(84px, 130px) repeat(${display.length}, minmax(34px, 1fr))`,
        }}
      >
        <div />
        {display.map((name) => (
          <div
            key={`h-${name}`}
            className="truncate pb-1 text-center text-[10px] text-zinc-500"
            title={name}
          >
            {name}
          </div>
        ))}
        {display.map((row) => (
          <FragmentRow
            key={`r-${row}`}
            row={row}
            columns={display}
            lookup={lookup}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-zinc-600">
        <span>-1</span>
        <div className="h-2 w-28 rounded-full bg-gradient-to-r from-rose-400 via-[#161d22] to-accent" />
        <span>+1</span>
      </div>
    </div>
  );
}

function FragmentRow({
  row,
  columns,
  lookup,
}: {
  row: string;
  columns: string[];
  lookup: Map<string, number>;
}) {
  return (
    <>
      <div className="flex items-center truncate pr-2 text-[10px] text-zinc-400" title={row}>
        {row}
      </div>
      {columns.map((col) => {
        const value = row === col ? 1 : (lookup.get(`${row}|${col}`) ?? 0);
        return (
          <div
            key={`${row}|${col}`}
            className="flex aspect-square items-center justify-center rounded text-[9px] font-medium text-white/80"
            style={{ backgroundColor: correlationColor(value) }}
            title={`${row} × ${col}: ${value.toFixed(3)}`}
          >
            {Math.abs(value) >= 0.995 ? value.toFixed(1) : ""}
          </div>
        );
      })}
    </>
  );
}

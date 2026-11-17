# CSV Intelligence

A production-ready, browser-based CSV analysis platform. Upload a CSV and get
real statistics, data-quality findings, automatic charts, safe cleaning tools
and exportable reports — **all computed locally in your browser**.

## Privacy & architecture

- No database, no authentication, no API calls with your data.
- CSV parsing and analysis run inside a **Web Worker** for large files, with an
  automatic main-thread fallback if workers are unavailable.
- The original dataset is kept in memory and never mutated; cleaning produces
  new datasets with undo/reset support.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS 3
- Recharts (charts) + custom SVG box plots / correlation heatmap
- Papa Parse (CSV parsing)
- Designed for one-click Vercel deployment

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Drag in a CSV, or load one
of the built-in sample datasets (including a deliberately messy one).

```bash
npm run typecheck   # strict TypeScript check
npm run build       # production build
npm start           # serve the production build
```

## Features

| Area | What it does |
| --- | --- |
| Upload | Drag & drop, file picker, format/size validation, BOM handling, sample datasets, clear errors |
| Overview | Rows, columns, cells, duplicates, missing values, file size, numeric/categorical split, quality score, schema |
| Column analysis | Type detection (integer, float, string, boolean, date) plus mean, median, mode, min/max, range, std dev, variance, quartiles and frequency distributions |
| Data quality | Missing values, duplicate rows, duplicate column names, mixed types, IQR outliers, empty and constant columns — with severity and explanations |
| Visualizations | Histograms, bar charts, box plots, Pearson correlation heatmap, missing-value distribution, per-column selection |
| Cleaning | Remove duplicate/empty rows, fill numeric (mean/median/zero) and categorical (mode/custom) gaps, remove/rename columns, change types, undo and reset |
| Export | Cleaned CSV, full JSON analysis report, statistical-summary CSV, data-quality CSV |

## Project structure

```
app/          Next.js routes, global styles, orchestrating client page
components/   Reusable UI, one view per section, chart components
lib/          Pure data logic: csv, values, statistics, columnAnalysis,
              dataQuality, analysis, cleaning, exporters, processor, formats
workers/      analysis.worker.ts — parsing + analysis off the main thread
types/        Shared TypeScript types
```

Data processing is intentionally separated from UI components: `lib/*` modules
are pure functions that can be tested independently of React.

## Numerical notes

- Quartiles use linear interpolation (R-7 / NumPy default).
- Standard deviation and variance are **sample** statistics (n−1).
- Outliers use the 1.5 × IQR rule.
- Missing tokens include empty cells and `N/A`, `null`, `none`, `nan`, `-`, `?`.
- Values that cannot be converted during a type change are left unchanged and
  reported, never silently dropped.

## Deployment on Vercel

Import the repository into Vercel; the framework preset is detected
automatically. No environment variables or backend services are required.

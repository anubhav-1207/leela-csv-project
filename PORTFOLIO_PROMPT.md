# Portfolio Document Prompt (for Gemini)

Paste the entire block below into Gemini. It contains all project facts, so
Gemini does not need access to the repository.

---

```
You are writing a formal academic project portfolio document. You do NOT have
access to any repository or website — do not try to visit links. Use ONLY the
facts given below. Do not invent contradictory facts. Do not include code
blocks.

PROJECT NAME: CSV Intelligence

PROJECT OVERVIEW:
CSV Intelligence is a data-analysis platform that lets a user upload a CSV
file and immediately receive a detailed, automated analysis of that dataset.
The user can explore statistics, detect data-quality problems, view charts,
clean the data safely, and export reports. All processing happens locally in
the user's own browser, so CSV contents are never uploaded to an external
server. No account, database or login is required. The interface uses a
professional dark charcoal theme with a left sidebar containing seven
sections: Overview, Data Preview, Column Analysis, Data Quality,
Visualizations, Data Cleaning, and Export. It is responsive on desktop and
mobile. Three built-in sample datasets are provided: retail sales, web
analytics, and a deliberately messy HR dataset.

--------------------------------------------------------------------------
SECTION FACTS — draw only from these when writing each section
--------------------------------------------------------------------------

1) INTRODUCTION FACTS:
- Problem: CSV files are everywhere, but turning a raw file into trustworthy
  insight normally needs manual spreadsheet work, specialist software, or
  uploading data to a third-party service.
- Solution: a single self-contained web application that analyses a CSV the
  moment it is opened and presents the results in a clean dashboard.
- Intended users: students, analysts, small-business owners, researchers and
  anyone who needs a quick, private first look at a dataset.
- Key themes: privacy by design, instant results, real calculations rather
  than placeholder numbers, and an accessible interface.
- Scope: file upload and validation, overview metrics, per-column statistics,
  data-quality detection, charts, cleaning operations and exports.

2) FEATURES FACTS:
- Upload: drag-and-drop and traditional file picker; filename and file size
  shown; validation of format, empty files and oversized files; graceful
  handling of malformed CSVs, BOM characters, duplicate column names and
  uneven rows; three sample datasets.
- Overview dashboard: total rows, columns and cells; duplicate rows; missing
  values; file size; number of numeric and categorical columns; a quality
  score out of 100; severity counts; schema table; completeness indicators.
- Column analysis: automatic type detection (integer, float, string, boolean,
  date). Numeric statistics: mean, median, mode, minimum, maximum, range,
  standard deviation, variance, quartiles Q1/Q2/Q3 and IQR. Categorical
  statistics: unique values, most frequent value, least frequent values and
  a full frequency distribution with percentages.
- Data quality: detects missing values, duplicate rows, duplicate column
  names, inconsistent data types, potential outliers using the 1.5×IQR rule,
  empty columns and constant columns. Each finding has a severity (error,
  warning or info), a plain-language explanation, the affected count and the
  columns involved.
- Visualizations: histograms for numeric columns, bar charts for categorical
  columns, box plots for numeric distributions, a Pearson correlation
  heatmap and a missing-value distribution chart. Users choose which columns
  to visualize and can toggle chart types on or off.
- Data preview: spreadsheet-style table, column sorting, full-text search
  across cells, pagination, row numbers and clear marking of missing values.
- Cleaning: remove duplicate rows, remove empty rows, fill missing numeric
  values using mean, median or zero, fill missing categorical values using
  the most frequent value or a custom value, remove selected columns, rename
  columns and change column data types. Every change is applied to a working
  copy; the original dataset is preserved and can be restored with Reset,
  and individual changes can be undone.
- Export: download the cleaned CSV, a complete JSON analysis report, a CSV
  statistical summary and a CSV data-quality report.
- Engineering qualities: reusable interface components, data-processing logic
  kept separate from the interface, strict type checking, edge-case handling,
  no mock statistics when a real file is loaded, no silent data loss, loading
  states and useful error messages, and background processing for large files.

3) OBJECTIVE FACTS:
- Primary objective: let any user understand an unfamiliar CSV dataset quickly
  and accurately without sending their data anywhere.
- Sub-objective 1 — Accuracy: compute genuine descriptive statistics using
  standard formulas (linear-interpolation quartiles, sample standard
  deviation, Pearson correlation, 1.5×IQR outlier fences).
- Sub-objective 2 — Comprehensiveness: cover the full workflow from upload to
  cleaning to export in one tool rather than several disconnected utilities.
- Sub-objective 3 — Trust: show every finding with an explanation and a
  severity level, so the user can judge whether an anomaly is a real problem.
- Sub-objective 4 — Safety: preserve the original dataset at all times; all
  cleaning is reversible through undo and reset.
- Sub-objective 5 — Privacy: no uploads, no database, no authentication, no
  external data-processing service.
- Sub-objective 6 — Usability: a clean dark interface, consistent spacing,
  restrained colours, responsive layout and clear feedback for every action.
- Sub-objective 7 — Robustness: handle empty files, malformed rows, missing
  tokens, duplicate headers, single-column files and very large files without
  crashing or freezing the interface.
- Sub-objective 8 — Verifiability: the finished application was tested with
  multiple sample CSV files, 24 automated data-logic checks, a full
  end-to-end browser walkthrough of all seven sections, and a successful
  production build.

4) LANGUAGES AND METHOD USED FACTS:
Main application implementation:
- The web application is built with Next.js 14 and TypeScript, styled with
  Tailwind CSS, with charts from Recharts and CSV parsing from Papa Parse.
- CSV parsing and analysis run in a client-side Web Worker, with an automatic
  main-thread fallback. Calculations are implemented as pure TypeScript
  functions separated from the interface components.
- The project is a fully static build and is deployable to Vercel.

Standalone Python and inline HTML component (give this section strong
emphasis — at least half of the section):
- The repository also contains a standalone Python demonstration file named
  extras/csv_inspector.py. It is intentionally separate from the web
  application — it is not imported, bundled or executed by the app; it sits
  in the repository as a Python demonstration of the same core data ideas.
- The Python file uses only the standard library: csv, statistics, html,
  argparse, io, re, dataclasses and pathlib.
- Method — CSV extraction: the csv module reads the file with proper handling
  of quoted fields and commas inside values; files are opened with UTF-8 with
  BOM support; the first row becomes the header and empty header names are
  replaced with generated column names.
- Method — missing values: empty cells and tokens such as N/A, null, none,
  nan, "-" and "?" are treated as missing.
- Method — type inference: each column is classified as integer, float,
  string, boolean or date (YYYY-MM-DD) by examining its non-missing values.
- Method — statistics: for numeric columns the script computes mean, median,
  minimum, maximum and population standard deviation using the statistics
  module; for text columns it finds the most frequent value and its count.
- Method — inline HTML: the script builds a complete HTML document as a Python
  string, with a <style> block embedded directly in the page (inline CSS).
  The report contains a dark-themed dashboard, metric cards, a column-profile
  table and a preview of the first raw CSV rows. All inserted values are
  escaped with html.escape so the output is safe.
- Method — CSV output: a second report is written with the csv module,
  summarising each column's name, type, populated count, missing count,
  unique count and computed statistics.
- Method — command-line interface: argparse provides an optional CSV file
  path plus --html and --summary output flags. A small CSV sample is embedded
  in the script so it also runs with no arguments.
- Testing method: the Python file was executed both with its embedded sample
  and with an external CSV containing quoted commas and missing values, and
  both the terminal summary and the generated HTML/CSV reports were verified.

5) FUTURE USE FACTS:
- Support for additional tabular formats such as Excel, TSV and JSON.
- More advanced statistics: skewness, kurtosis, confidence intervals and
  time-series decomposition.
- Optional machine-learning assistance for anomaly detection and automated
  column-type suggestions.
- Multi-file comparison and merging of related datasets.
- Saved analysis sessions and shareable report links.
- Deeper data-cleaning workflows: batch transformations, custom validation
  rules and full change history.
- More chart types and interactive filtering across the whole dashboard.
- Natural-language questions about a dataset.
- Classroom and training use: a safe, privacy-preserving tool for teaching
  descriptive statistics and data literacy.
- Use by small organisations for quick internal reporting without exposing
  sensitive data to third-party services.
- Offline installation for use in environments with no internet access.
- Localisation into multiple languages and improved accessibility.

6) CONCLUSION FACTS:
- The project successfully delivers a complete, private, end-to-end CSV
  analysis workflow in one application.
- It covers upload, overview, column statistics, quality checks, charts,
  reversible cleaning and export.
- It was verified with real sample datasets, automated logic tests, a full
  browser walkthrough and a clean production build.
- The standalone Python file demonstrates the same core ideas — CSV reading,
  type detection, statistics and inline HTML report generation — using only
  the Python standard library.
- Main takeaways: careful data handling, honest reporting of findings,
  preserving original data, and keeping the user in control of their data.

--------------------------------------------------------------------------
WRITING INSTRUCTIONS
--------------------------------------------------------------------------
Write the document with EXACTLY these sections, in this order:
1. Introduction — 1 page (approximately 400 words)
2. Features — 2 pages (approximately 850 words)
3. Objective — 2 pages (approximately 850 words)
4. Languages and Method Used — 2 pages (approximately 850 words)
5. Future Use — 2 pages (approximately 850 words)
6. Conclusion — 1 page (approximately 400 words)

Formatting rules:
- Start directly with "1. Introduction". No separate title page.
- Use the exact numbered headings shown above.
- Insert the marker line  --- PAGE BREAK ---  on its own line wherever a page
  ends, including between the two pages of a two-page section and at the end
  of each section.
- Formal academic tone, third person only. No "I", "we", "you", no emojis.
- Use short paragraphs, bullet lists and at most one small table per section.
- Do not include source code. The only file path to mention is
  extras/csv_inspector.py.
- Aim for the stated word counts so the page allocations are realistic.
```

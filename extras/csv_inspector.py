from __future__ import annotations

import argparse
import csv
import html
import io
import re
import statistics
from dataclasses import dataclass, field
from pathlib import Path
from typing import TextIO

SAMPLE_CSV = """name,team,score,active,joined
Ada,Core,98,true,2024-01-05
Grace,Core,95,true,2024-02-11
Linus,Platform,88,false,2024-01-22
Barbara,Platform,,true,2024-03-03
Ken,Core,91,true,2024-02-17
Dennis,Platform,79,false,2024-01-30
Margaret,Core,99,true,2024-03-14
Alan,Research,84,true,2024-02-08
Tim,Research,,false,2024-03-21
Guido,Research,93,true,2024-02-25
"""

MISSING_TOKENS = {"", "na", "n/a", "null", "none", "nan", "-", "?"}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
BOOLEAN_TOKENS = {"true", "false", "yes", "no", "t", "f"}


def is_missing(value: str) -> bool:
    """Return True for empty cells and common null tokens."""
    return value.strip().lower() in MISSING_TOKENS


def is_integer(value: str) -> bool:
    try:
        int(value.strip().replace(",", ""))
        return True
    except ValueError:
        return False


def is_float(value: str) -> bool:
    try:
        float(value.strip().replace(",", ""))
        return True
    except ValueError:
        return False


def detect_type(values: list[str]) -> str:
    """Guess a column type from its non-missing values."""
    present = [v.strip() for v in values if not is_missing(v)]
    if not present:
        return "empty"
    if all(v.lower() in BOOLEAN_TOKENS for v in present):
        return "boolean"
    if all(is_integer(v) for v in present):
        return "integer"
    if all(is_float(v) for v in present):
        return "float"
    if all(DATE_RE.match(v) for v in present):
        return "date"
    return "string"


@dataclass
class ColumnProfile:
    name: str
    index: int
    type: str
    populated: int
    missing: int
    unique: int
    stats: dict[str, float | str] = field(default_factory=dict)


@dataclass
class Profile:
    source: str
    rows: int
    columns: int
    cells: int
    missing: int
    columns_data: list[ColumnProfile]
    preview: list[list[str]]


def profile_csv(source: str, stream: TextIO, preview_rows: int = 5) -> Profile:
    """Read CSV text from a stream and build a basic dataset profile."""
    reader = csv.reader(stream)
    headers = [cell.strip() or f"Column {i + 1}" for i, cell in enumerate(next(reader, []))]
    if not headers:
        raise ValueError("The CSV has no header row.")

    rows = list(reader)
    width = len(headers)
    profiles: list[ColumnProfile] = []

    for index, header in enumerate(headers):
        values = [row[index] if index < len(row) else "" for row in rows]
        present = [v for v in values if not is_missing(v)]
        column_type = detect_type(values)
        stats: dict[str, float | str] = {}

        if column_type in {"integer", "float"}:
            numbers = [float(v.strip().replace(",", "")) for v in present]
            if numbers:
                stats = {
                    "mean": round(statistics.mean(numbers), 4),
                    "median": round(statistics.median(numbers), 4),
                    "min": min(numbers),
                    "max": max(numbers),
                    "stdev": round(statistics.pstdev(numbers), 4) if len(numbers) > 1 else 0.0,
                }
        else:
            counts: dict[str, int] = {}
            for value in present:
                counts[value.strip()] = counts.get(value.strip(), 0) + 1
            if counts:
                most = max(counts.items(), key=lambda pair: pair[1])
                stats = {"most_frequent": most[0], "occurrences": most[1]}

        profiles.append(
            ColumnProfile(
                name=header,
                index=index,
                type=column_type,
                populated=len(present),
                missing=len(values) - len(present),
                unique=len({v.strip() for v in present}),
                stats=stats,
            )
        )

    return Profile(
        source=source,
        rows=len(rows),
        columns=width,
        cells=len(rows) * width,
        missing=sum(col.missing for col in profiles),
        columns_data=profiles,
        preview=[row[:width] for row in rows[:preview_rows]],
    )


def render_html(profile: Profile) -> str:
    """Return a complete, self-contained HTML report with inline CSS."""
    def esc(value: object) -> str:
        return html.escape(str(value))

    column_rows = "\n".join(
        "<tr>"
        f"<td class='name'>{esc(col.name)}</td>"
        f"<td><span class='tag {col.type}'>{esc(col.type)}</span></td>"
        f"<td class='num'>{col.populated}</td>"
        f"<td class='num'>{col.missing}</td>"
        f"<td class='num'>{col.unique}</td>"
        f"<td class='stats'>{esc(', '.join(f'{k}={v}' for k, v in col.stats.items()) or '—')}</td>"
        "</tr>"
        for col in profile.columns_data
    )

    preview_rows = "\n".join(
        "<tr>" + "".join(f"<td>{esc(cell)}</td>" for cell in row) + "</tr>"
        for row in profile.preview
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CSV Inspector — {esc(profile.source)}</title>
<style>
  body {{ background:#0e1015; color:#e7e9ee; font:14px system-ui,sans-serif; margin:0; padding:32px; }}
  h1 {{ margin:0 0 4px; font-size:22px; }}
  h2 {{ margin:28px 0 10px; font-size:15px; color:#2dd4bf; }}
  .sub {{ color:#71798a; margin-bottom:24px; }}
  .cards {{ display:flex; gap:12px; flex-wrap:wrap; }}
  .card {{ background:#12151b; border:1px solid #212630; border-radius:10px; padding:14px 18px; }}
  .card .v {{ font:600 22px ui-monospace,monospace; }}
  .card .k {{ font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:#71798a; }}
  table {{ border-collapse:collapse; width:100%; background:#12151b; border:1px solid #212630; border-radius:10px; overflow:hidden; }}
  th, td {{ text-align:left; padding:9px 12px; border-bottom:1px solid #212630; font-size:12px; }}
  th {{ color:#71798a; text-transform:uppercase; font-size:10px; letter-spacing:.08em; }}
  .num {{ text-align:right; font-family:ui-monospace,monospace; }}
  .name {{ font-weight:600; }}
  .stats {{ color:#9ca3af; font-family:ui-monospace,monospace; }}
  .tag {{ border-radius:4px; padding:2px 6px; font-size:10px; background:#272d38; }}
  .tag.integer,.tag.float {{ color:#7dd3fc; }} .tag.date {{ color:#fcd34d; }}
  .tag.boolean {{ color:#c4b5fd; }} .tag.empty {{ color:#fda4af; }}
  .note {{ color:#525a69; font-size:11px; margin-top:24px; }}
</style>
</head>
<body>
<h1>CSV Inspector</h1>
<div class="sub">Source: {esc(profile.source)} — a standalone Python demo, not part of the web app.</div>
<div class="cards">
  <div class="card"><div class="v">{profile.rows}</div><div class="k">rows</div></div>
  <div class="card"><div class="v">{profile.columns}</div><div class="k">columns</div></div>
  <div class="card"><div class="v">{profile.cells}</div><div class="k">cells</div></div>
  <div class="card"><div class="v">{profile.missing}</div><div class="k">missing</div></div>
</div>
<h2>Column profile</h2>
<table>
<thead><tr><th>Column</th><th>Type</th><th>Populated</th><th>Missing</th><th>Unique</th><th>Statistics</th></tr></thead>
<tbody>
{column_rows}
</tbody>
</table>
<h2>First {len(profile.preview)} CSV rows (raw)</h2>
<table>
<tbody>
{preview_rows}
</tbody>
</table>
<div class="note">Generated with the Python standard library — csv, statistics, html, argparse.</div>
</body>
</html>
"""


def write_summary_csv(profile: Profile, path: Path) -> None:
    """Write a CSV summary of every column."""
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["column", "type", "populated", "missing", "unique", "stats"])
        for col in profile.columns_data:
            writer.writerow([
                col.name,
                col.type,
                col.populated,
                col.missing,
                col.unique,
                "; ".join(f"{k}={v}" for k, v in col.stats.items()),
            ])


def print_summary(profile: Profile) -> None:
    print(f"Source : {profile.source}")
    print(f"Shape  : {profile.rows} rows x {profile.columns} columns ({profile.cells} cells)")
    print(f"Missing: {profile.missing}")
    print()
    print(f"{'Column':<16} {'Type':<9} {'Filled':>6} {'Missing':>7} {'Unique':>6}  Stats")
    print("-" * 88)
    for col in profile.columns_data:
        stats = ", ".join(f"{k}={v}" for k, v in col.stats.items()) or "—"
        print(f"{col.name[:15]:<16} {col.type:<9} {col.populated:>6} {col.missing:>7} {col.unique:>6}  {stats}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Standalone CSV profiling demo (Python).")
    parser.add_argument("csv_file", nargs="?", help="CSV file to inspect; omit to use the embedded sample")
    parser.add_argument("--html", type=Path, help="write an inline-styled HTML report")
    parser.add_argument("--summary", type=Path, help="write a CSV summary")
    args = parser.parse_args()

    if args.csv_file:
        source = str(args.csv_file)
        with Path(args.csv_file).open(newline="", encoding="utf-8-sig") as handle:
            profile = profile_csv(source, handle)
    else:
        profile = profile_csv("(embedded sample)", io.StringIO(SAMPLE_CSV))

    print_summary(profile)

    if args.html:
        args.html.write_text(render_html(profile), encoding="utf-8")
        print(f"\nHTML report : {args.html}")
    if args.summary:
        write_summary_csv(profile, args.summary)
        print(f"CSV summary : {args.summary}")


if __name__ == "__main__":
    main()

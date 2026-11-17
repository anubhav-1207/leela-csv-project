"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowDownAZ,
  ChevronLeft,
  ChevronRight,
  Hash,
  Search,
  X,
} from "lucide-react";
import { formatCompact } from "@/lib/format";
import { isMissing } from "@/lib/values";
import { isNumericType } from "@/types";
import type { Analysis, Dataset } from "@/types";
import { Panel, TypeBadge } from "./ui";

const PAGE_SIZE = 25;

interface DataPreviewProps {
  dataset: Dataset;
  analysis: Analysis;
}

export function DataPreview({ dataset, analysis }: DataPreviewProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ index: number; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => setPage(0), [query, sort, dataset]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const indexed = dataset.rows.map((row, index) => ({ row, index }));

    const matched = q
      ? indexed.filter(({ row }) =>
          row.some((cell) => cell.toLowerCase().includes(q))
        )
      : indexed;

    if (sort) {
      const column = analysis.columns[sort.index];
      const numeric = column ? isNumericType(column.type) : false;
      const factor = sort.dir === "asc" ? 1 : -1;
      matched.sort((a, b) => {
        const av = a.row[sort.index] ?? "";
        const bv = b.row[sort.index] ?? "";
        if (isMissing(av) && isMissing(bv)) return 0;
        if (isMissing(av)) return 1;
        if (isMissing(bv)) return -1;
        if (numeric) {
          const an = Number(av.replace(/,/g, ""));
          const bn = Number(bv.replace(/,/g, ""));
          if (Number.isFinite(an) && Number.isFinite(bn)) return (an - bn) * factor;
        }
        const cmp = av.localeCompare(bv, undefined, { numeric: true });
        return cmp * factor;
      });
    }
    return matched;
  }, [dataset, query, sort, analysis]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  function toggleSort(index: number) {
    setSort((prev) =>
      prev?.index === index
        ? prev.dir === "asc"
          ? { index, dir: "desc" }
          : null
        : { index, dir: "asc" }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all cells…"
            className="input pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-mono text-zinc-300">{formatCompact(filtered.length)}</span>
          of {formatCompact(dataset.rows.length)} rows
          {sort && (
            <button
              type="button"
              onClick={() => setSort(null)}
              className="ml-1 inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-zinc-400 hover:text-white"
            >
              <ArrowDownAZ size={12} /> clear sort
            </button>
          )}
        </div>
      </div>

      <Panel className="overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: "min(62vh, 640px)" }}>
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-panel2">
              <tr>
                <th className="sticky left-0 z-20 border-b border-r border-line bg-panel2 px-3 py-2.5 text-right font-mono text-[10px] font-medium text-zinc-600">
                  #
                </th>
                {dataset.columns.map((name, index) => {
                  const column = analysis.columns[index];
                  const active = sort?.index === index;
                  return (
                    <th key={`${name}-${index}`} className="min-w-[140px] border-b border-r border-line bg-panel2 px-3 py-2.5 last:border-r-0">
                      <button
                        type="button"
                        onClick={() => toggleSort(index)}
                        className="group flex w-full items-center gap-2 text-left"
                        title={`Sort by ${name}`}
                      >
                        <span className={`truncate font-medium ${active ? "text-accent" : "text-zinc-300 group-hover:text-white"}`}>
                          {name}
                        </span>
                        {active ? (
                          <ArrowDown size={12} className={`shrink-0 text-accent ${sort?.dir === "asc" ? "rotate-180" : ""}`} />
                        ) : (
                          <ArrowDown size={12} className="shrink-0 text-zinc-700 opacity-0 group-hover:opacity-100" />
                        )}
                      </button>
                      {column && (
                        <div className="mt-1">
                          <TypeBadge type={column.type} />
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50 font-mono">
              {visible.map(({ row, index }) => (
                <tr key={index} className="hover:bg-white/[0.025]">
                  <td className="sticky left-0 z-10 border-r border-line bg-panel px-3 py-2 text-right text-[10px] text-zinc-700">
                    {index + 1}
                  </td>
                  {row.map((cell, cellIndex) => {
                    const column = analysis.columns[cellIndex];
                    const numeric = column ? isNumericType(column.type) : false;
                    const missing = isMissing(cell);
                    const matched =
                      query.trim() !== "" &&
                      cell.toLowerCase().includes(query.trim().toLowerCase());
                    return (
                      <td
                        key={cellIndex}
                        className={`max-w-[260px] truncate border-r border-line/50 px-3 py-2 last:border-r-0 ${
                          numeric ? "text-right" : "text-left"
                        } ${missing ? "italic text-zinc-700" : "text-zinc-300"} ${
                          matched ? "bg-accent/10 text-accent" : ""
                        }`}
                        title={cell}
                      >
                        {missing ? "∅" : cell === "" ? "∅" : cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={dataset.columns.length + 1}
                    className="px-4 py-16 text-center text-sm text-zinc-600"
                  >
                    No rows match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <span className="text-xs text-zinc-500">
            Rows {filtered.length ? start + 1 : 0}–
            {Math.min(start + PAGE_SIZE, filtered.length)} of {formatCompact(filtered.length)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="btn-ghost px-2 py-1.5 text-xs"
            >
              <ChevronLeft size={15} /> Prev
            </button>
            <span className="px-2 font-mono text-xs text-zinc-400">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="btn-ghost px-2 py-1.5 text-xs"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </Panel>
      <div className="flex items-center gap-2 text-[11px] text-zinc-600">
        <Hash size={12} />
        <span>∅ denotes a missing value. Click any column header to sort.</span>
      </div>
    </div>
  );
}

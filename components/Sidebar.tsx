"use client";

import {
  BarChart3,
  Check,
  Columns3,
  Database,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Table2,
  Upload,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatBytes, formatCompact } from "@/lib/format";
import type { Analysis, Dataset, Section } from "@/types";

const NAV: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "preview", label: "Data Preview", icon: Table2 },
  { id: "columns", label: "Column Analysis", icon: Columns3 },
  { id: "quality", label: "Data Quality", icon: ShieldCheck },
  { id: "visualizations", label: "Visualizations", icon: BarChart3 },
  { id: "cleaning", label: "Data Cleaning", icon: Sparkles },
  { id: "export", label: "Export", icon: Download },
];

interface SidebarProps {
  active: Section;
  onSelect: (section: Section) => void;
  dataset: Dataset | null;
  analysis: Analysis | null;
  hasChanges: boolean;
  onReset: () => void;
  onNew: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  active,
  onSelect,
  dataset,
  analysis,
  hasChanges,
  onReset,
  onNew,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const nav = (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
          <Database size={17} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-white">
            CSV Intelligence
          </div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-600">
            Local analytics
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="ml-auto rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Workspace
        </div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          const disabled = !dataset && item.id !== "overview";
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                onSelect(item.id);
                onCloseMobile();
              }}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : disabled
                  ? "cursor-not-allowed text-zinc-700"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
              }`}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        {dataset ? (
          <div className="mb-2 rounded-lg border border-line bg-canvas/60 p-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={15} className="shrink-0 text-accent" />
              <span className="truncate text-xs font-medium text-zinc-200" title={dataset.name}>
                {dataset.name}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-zinc-500">
              <span>{formatCompact(analysis?.overview.rows ?? 0)} rows</span>
              <span>{dataset.columns.length} cols</span>
              <span>{formatBytes(analysis?.overview.size ?? dataset.size)}</span>
            </div>
            {hasChanges && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Modified from original
              </div>
            )}
          </div>
        ) : (
          <div className="mb-2 rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-zinc-600">
            No dataset loaded
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onNew}
            className="btn-subtle flex-1 text-xs"
          >
            <Upload size={14} /> New
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={!hasChanges}
            title="Reset to original dataset"
            className="btn-subtle px-3 text-xs"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-line bg-surface lg:flex">
        {nav}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[270px] flex-col border-r border-line bg-surface shadow-2xl">
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-line p-2 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
      aria-label="Open menu"
    >
      <Menu size={18} />
    </button>
  );
}

export function ChangeIndicator({ changed }: { changed: boolean }) {
  return changed ? (
    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
      <Check size={11} /> changed
    </span>
  ) : null;
}

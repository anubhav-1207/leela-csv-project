"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Braces,
  Check,
  Copy,
  Droplet,
  Eraser,
  History,
  RotateCcw,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  changeColumnType,
  fillMissingCategorical,
  fillMissingNumeric,
  removeColumns,
  removeDuplicateRows,
  removeEmptyRows,
  renameColumn,
} from "@/lib/cleaning";
import { formatNumber } from "@/lib/format";
import { isMissing } from "@/lib/values";
import type {
  Analysis,
  CategoricalFillStrategy,
  CleaningResult,
  ColumnType,
  Dataset,
  NumericFillStrategy,
} from "@/types";
import { Panel, SegmentedControl, TypeBadge } from "./ui";

interface CleaningViewProps {
  dataset: Dataset;
  analysis: Analysis;
  onApply: (result: CleaningResult) => void;
  onReset: () => void;
  onUndo: () => void;
  historyLength: number;
  activity: string[];
  hasChanges: boolean;
}

function OperationCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
          <Icon size={16} strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
            {badge && <span className="pill px-2 py-0.5 text-[10px]">{badge}</span>}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </Panel>
  );
}

export function CleaningView({
  dataset,
  analysis,
  onApply,
  onReset,
  onUndo,
  historyLength,
  activity,
  hasChanges,
}: CleaningViewProps) {
  const [numericStrategy, setNumericStrategy] = useState<NumericFillStrategy>("mean");
  const [categoricalStrategy, setCategoricalStrategy] = useState<CategoricalFillStrategy>("mode");
  const [customValue, setCustomValue] = useState("");
  const [removeSet, setRemoveSet] = useState<Set<number>>(new Set());
  const [renameIndex, setRenameIndex] = useState(0);
  const [renameValue, setRenameValue] = useState("");
  const [typeIndex, setTypeIndex] = useState(0);
  const [targetType, setTargetType] = useState<ColumnType>("string");

  const emptyRows = useMemo(
    () => dataset.rows.filter((row) => row.every((cell) => isMissing(cell))).length,
    [dataset]
  );
  const numericCount = analysis.overview.numericColumns;
  const categoricalCount = analysis.overview.categoricalColumns;
  const missingNumeric = analysis.columns
    .filter((c) => (c.type === "integer" || c.type === "float") && c.missing > 0)
    .reduce((acc, c) => acc + c.missing, 0);
  const missingCategorical = analysis.columns
    .filter((c) => c.type !== "integer" && c.type !== "float" && c.missing > 0)
    .reduce((acc, c) => acc + c.missing, 0);

  const selectClass = "input appearance-none pr-8";

  return (
    <div className="space-y-5">
      <Panel className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-canvas text-zinc-400">
            <History size={17} />
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-200">
              {hasChanges ? "Working on a modified copy" : "Original dataset"}
            </div>
            <div className="text-xs text-zinc-500">
              {historyLength} change{historyLength === 1 ? "" : "s"} in this session · original kept safe
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onUndo} disabled={historyLength === 0} className="btn-ghost text-xs">
            <RotateCcw size={14} /> Undo last
          </button>
          <button type="button" onClick={onReset} disabled={!hasChanges} className="btn-subtle text-xs">
            <Sparkles size={14} /> Reset to original
          </button>
        </div>
      </Panel>

      {activity.length > 0 && (
        <Panel className="p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-400">
            <Check size={14} className="text-accent" /> Recent actions
          </div>
          <ul className="space-y-1.5">
            {activity.slice(0, 5).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-500">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <OperationCard
          icon={Copy}
          title="Remove duplicate rows"
          description="Keep the first occurrence of each identical row."
          badge={`${formatNumber(analysis.overview.duplicates, 0)} found`}
        >
          <button
            type="button"
            disabled={analysis.overview.duplicates === 0}
            onClick={() => onApply(removeDuplicateRows(dataset))}
            className="btn-subtle w-full text-xs"
          >
            <Trash2 size={14} /> Remove {formatNumber(analysis.overview.duplicates, 0)} duplicates
          </button>
        </OperationCard>

        <OperationCard
          icon={Eraser}
          title="Remove empty rows"
          description="Delete rows where every cell is empty or a null token."
          badge={`${formatNumber(emptyRows, 0)} found`}
        >
          <button
            type="button"
            disabled={emptyRows === 0}
            onClick={() => onApply(removeEmptyRows(dataset))}
            className="btn-subtle w-full text-xs"
          >
            <Trash2 size={14} /> Remove {formatNumber(emptyRows, 0)} empty rows
          </button>
        </OperationCard>

        <OperationCard
          icon={Droplet}
          title="Fill missing numeric values"
          description={`Apply a statistic across all ${numericCount} numeric columns.`}
          badge={`${formatNumber(missingNumeric, 0)} cells`}
        >
          <div className="space-y-3">
            <SegmentedControl
              value={numericStrategy}
              onChange={setNumericStrategy}
              options={[
                { value: "mean", label: "Mean" },
                { value: "median", label: "Median" },
                { value: "zero", label: "Zero" },
              ]}
            />
            <button
              type="button"
              disabled={missingNumeric === 0}
              onClick={() => onApply(fillMissingNumeric(dataset, numericStrategy))}
              className="btn-subtle w-full text-xs"
            >
              Fill with {numericStrategy} <ArrowRight size={13} />
            </button>
          </div>
        </OperationCard>

        <OperationCard
          icon={Droplet}
          title="Fill missing categorical values"
          description={`Fill text, boolean and date columns with a mode or custom value.`}
          badge={`${formatNumber(missingCategorical, 0)} cells`}
        >
          <div className="space-y-3">
            <SegmentedControl
              value={categoricalStrategy}
              onChange={setCategoricalStrategy}
              options={[
                { value: "mode", label: "Most frequent" },
                { value: "custom", label: "Custom" },
              ]}
            />
            {categoricalStrategy === "custom" && (
              <input
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Replacement value"
                className="input"
              />
            )}
            <button
              type="button"
              disabled={missingCategorical === 0}
              onClick={() => onApply(fillMissingCategorical(dataset, categoricalStrategy, customValue))}
              className="btn-subtle w-full text-xs"
            >
              Fill missing values <ArrowRight size={13} />
            </button>
          </div>
        </OperationCard>

        <OperationCard
          icon={Trash2}
          title="Remove columns"
          description="Select the columns you want to drop from the dataset."
          badge={`${removeSet.size} selected`}
        >
          <div className="space-y-3">
            <div className="max-h-32 overflow-y-auto rounded-lg border border-line bg-canvas p-2">
              {dataset.columns.map((name, index) => (
                <label
                  key={`${name}-${index}`}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.04]"
                >
                  <input
                    type="checkbox"
                    checked={removeSet.has(index)}
                    onChange={(e) =>
                      setRemoveSet((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(index);
                        else next.delete(index);
                        return next;
                      })
                    }
                    className="accent-[#2dd4bf]"
                  />
                  <span className="truncate">{name}</span>
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={removeSet.size === 0 || removeSet.size === dataset.columns.length}
              onClick={() => {
                onApply(removeColumns(dataset, [...removeSet]));
                setRemoveSet(new Set());
              }}
              className="btn-subtle w-full text-xs"
            >
              Remove {removeSet.size} columns <ArrowRight size={13} />
            </button>
          </div>
        </OperationCard>

        <div className="space-y-4">
          <OperationCard
            icon={Type}
            title="Rename a column"
            description="Give a column a clearer, unambiguous name."
          >
            <div className="flex gap-2">
              <select
                value={renameIndex}
                onChange={(e) => {
                  const index = Number(e.target.value);
                  setRenameIndex(index);
                  setRenameValue("");
                }}
                className={`${selectClass} flex-1`}
              >
                {dataset.columns.map((name, index) => (
                  <option key={`${name}-${index}`} value={index}>{name}</option>
                ))}
              </select>
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="New name"
                className="input flex-1"
              />
            </div>
            <button
              type="button"
              disabled={!renameValue.trim()}
              onClick={() => {
                onApply(renameColumn(dataset, renameIndex, renameValue));
                setRenameValue("");
              }}
              className="btn-subtle mt-3 w-full text-xs"
            >
              Rename column <ArrowRight size={13} />
            </button>
          </OperationCard>

          <OperationCard
            icon={Braces}
            title="Change column type"
            description="Convert values to a different detected type."
          >
            <div className="flex gap-2">
              <select
                value={typeIndex}
                onChange={(e) => setTypeIndex(Number(e.target.value))}
                className={`${selectClass} flex-1`}
              >
                {dataset.columns.map((name, index) => (
                  <option key={`${name}-${index}`} value={index}>{name}</option>
                ))}
              </select>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as ColumnType)}
                className={`${selectClass} w-32`}
              >
                {(["integer", "float", "string", "boolean", "date"] as ColumnType[]).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => onApply(changeColumnType(dataset, typeIndex, targetType))}
              className="btn-subtle mt-3 w-full text-xs"
            >
              Convert values <ArrowRight size={13} />
            </button>
          </OperationCard>
        </div>
      </div>

      <Panel className="p-5">
        <div className="mb-3 text-xs font-medium text-zinc-400">Current dataset shape</div>
        <div className="flex flex-wrap gap-6">
          <div>
            <div className="font-mono text-xl font-semibold text-white">{formatNumber(dataset.rows.length, 0)}</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-600">Rows</div>
          </div>
          <div>
            <div className="font-mono text-xl font-semibold text-white">{dataset.columns.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-600">Columns</div>
          </div>
          <div>
            <div className="font-mono text-xl font-semibold text-white">{(dataset.rows.length * dataset.columns.length).toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-600">Cells</div>
          </div>
          <div className="flex flex-wrap items-end gap-1.5">
            {analysis.columns.slice(0, 12).map((column) => (
              <TypeBadge key={column.index} type={column.type} />
            ))}
            {analysis.columns.length > 12 && <span className="text-[10px] text-zinc-600">+{analysis.columns.length - 12}</span>}
          </div>
        </div>
      </Panel>
    </div>
  );
}

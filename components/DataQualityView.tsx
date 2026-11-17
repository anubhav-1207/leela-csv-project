"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Info,
  Layers3,
  ListX,
  ShieldCheck,
  Sigma,
  TableProperties,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { Analysis, QualityIssueType, Severity } from "@/types";
import { EmptyState, Panel, ProgressBar, SegmentedControl, SeverityBadge } from "./ui";

const ISSUE_ICONS: Record<QualityIssueType, LucideIcon> = {
  "missing-values": ListX,
  "duplicate-rows": Copy,
  "duplicate-columns": Layers3,
  "inconsistent-types": Sigma,
  outliers: TriangleAlert,
  "empty-column": TableProperties,
  "constant-column": TableProperties,
  "ragged-rows": AlertCircle,
};

function ScoreBanner({ score, counts }: { score: number; counts: Record<Severity, number> }) {
  const tone = score >= 80 ? "accent" : score >= 55 ? "amber" : "rose";
  const color = tone === "accent" ? "text-accent" : tone === "amber" ? "text-amber-300" : "text-rose-300";
  return (
    <Panel className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-line bg-canvas">
          <ShieldCheck size={28} strokeWidth={1.6} className={color} />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-500">Overall quality score</div>
          <div className={`mt-1 font-mono text-3xl font-semibold ${color}`}>
            {score}<span className="text-base text-zinc-600">/100</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {score >= 80 ? "Healthy dataset" : score >= 55 ? "Needs some attention" : "Several issues to review"}
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-3 sm:pl-6">
        <ProgressBar value={score} tone={tone} className="h-2" />
        <div className="grid grid-cols-3 gap-2 text-center">
          {(["error", "warning", "info"] as const).map((severity) => (
            <div key={severity} className="rounded-lg border border-line bg-canvas/50 py-2">
              <div className="font-mono text-lg font-semibold text-zinc-200">{counts[severity]}</div>
              <div className="text-[10px] capitalize text-zinc-600">{severity}s</div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function DataQualityView({ analysis }: { analysis: Analysis }) {
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const { quality } = analysis;
  const issues = quality.issues.filter((issue) => filter === "all" || issue.severity === filter);

  return (
    <div className="space-y-5">
      <ScoreBanner score={quality.score} counts={quality.counts} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-400">
          <span className="font-mono text-zinc-200">{quality.issues.length}</span> finding
          {quality.issues.length === 1 ? "" : "s"} detected
        </div>
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "error", label: "Errors" },
            { value: "warning", label: "Warnings" },
            { value: "info", label: "Info" },
          ]}
        />
      </div>

      {issues.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={filter === "all" ? "No issues detected" : `No ${filter} findings`}
          description={
            filter === "all"
              ? "This dataset passed every quality check. You're good to go."
              : "Try another severity filter to see the remaining findings."
          }
        />
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => {
            const Icon = ISSUE_ICONS[issue.type] ?? AlertTriangle;
            return (
              <Panel key={issue.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-zinc-400">
                    <Icon size={17} strokeWidth={1.7} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-zinc-100">{issue.title}</h3>
                      <SeverityBadge severity={issue.severity} />
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{issue.description}</p>
                    {issue.columns.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {issue.columns.slice(0, 8).map((column, i) => (
                          <span key={`${column}-${i}`} className="pill font-mono text-[10px]">
                            {column}
                          </span>
                        ))}
                        {issue.columns.length > 8 && (
                          <span className="pill text-[10px]">+{issue.columns.length - 8} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <div className="font-mono text-lg font-semibold text-zinc-200">
                      {formatNumber(issue.affected, 0)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-600">affected</div>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-line/60 bg-surface/40 p-4 text-xs leading-relaxed text-zinc-500">
        <Info size={15} className="mt-0.5 shrink-0 text-zinc-600" />
        <p>
          Quality checks are statistical signals, not verdicts. Outliers and constant columns
          may be perfectly valid in your domain — review them before applying any cleanup.
        </p>
      </div>
    </div>
  );
}

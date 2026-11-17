import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { typeLabel, severityStyles } from "@/lib/format";
import type { ColumnType, Severity } from "@/types";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function SectionHeading({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
            <Icon size={18} strokeWidth={1.8} />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent" | "amber" | "rose" | "sky";
}) {
  const toneStyles: Record<string, string> = {
    default: "text-zinc-400 bg-white/[0.04] border-white/[0.06]",
    accent: "text-accent bg-accent/10 border-accent/20",
    amber: "text-amber-300 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-300 bg-rose-500/10 border-rose-500/20",
    sky: "text-sky-300 bg-sky-500/10 border-sky-500/20",
  };
  return (
    <div className="panel panel-hover p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-md border ${toneStyles[tone]}`}
        >
          <Icon size={14} strokeWidth={1.8} />
        </span>
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold tracking-tight text-white">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-zinc-600">{hint}</div>}
    </div>
  );
}

const TYPE_TONES: Record<ColumnType, string> = {
  integer: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  float: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  string: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
  boolean: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  date: "border-amber-500/20 bg-amber-500/10 text-amber-300",
};

export function TypeBadge({ type }: { type: ColumnType }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium ${TYPE_TONES[type]}`}
    >
      {typeLabel(type)}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const style = severityStyles[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium capitalize ${style.bg} ${style.border} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {severity}
    </span>
  );
}

export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-white/[0.03] text-zinc-500">
        <Icon size={22} strokeWidth={1.6} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-zinc-200">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-zinc-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "accent",
  className = "",
}: {
  value: number;
  tone?: "accent" | "amber" | "rose";
  className?: string;
}) {
  const color =
    tone === "rose"
      ? "bg-rose-400"
      : tone === "amber"
      ? "bg-amber-400"
      : "bg-accent";
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] ${className}`}>
      <div
        className={`h-full rounded-full ${color} transition-[width] duration-500`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/60 py-2.5 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span
        className={`text-sm font-medium text-zinc-200 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-canvas p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === option.value
              ? "bg-white/[0.08] text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

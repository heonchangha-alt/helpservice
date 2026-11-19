import { cn } from "@/lib/utils";
import { STAGES, type Priority, type Stage } from "@/lib/types";
import { SLA_LABEL, type SlaStatus } from "@/lib/sla";

const PRI: Record<Priority, string> = {
  긴급: "bg-destructive/10 text-destructive border-destructive/25",
  높음: "bg-accent text-accent-foreground border-[hsl(33_80%_70%)]",
  보통: "bg-primary/8 text-primary border-primary/20",
  낮음: "bg-muted text-muted-foreground border-border",
};

export function PriorityBadge({ p }: { p: Priority }) {
  return (
    <span data-testid={`badge-priority-${p}`} className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold", PRI[p])}>
      {p}
    </span>
  );
}

const SLA: Record<SlaStatus, string> = {
  met: "text-[hsl(162_48%_30%)] bg-[hsl(162_48%_36%/0.1)]",
  ok: "text-[hsl(162_48%_30%)] bg-[hsl(162_48%_36%/0.1)]",
  risk: "text-accent-foreground bg-accent",
  breached: "text-destructive bg-destructive/10",
};

export function SlaBadge({ s }: { s: SlaStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", SLA[s])}>
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current", s === "risk" && "animate-pulse")} />
      SLA {SLA_LABEL[s]}
    </span>
  );
}

export function StageBadge({ s }: { s: Stage }) {
  const done = s === "완료" || s === "평가";
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold", done ? "bg-[hsl(162_48%_36%/0.12)] text-[hsl(162_48%_28%)]" : "bg-primary text-primary-foreground")}>
      {s}
    </span>
  );
}

export function StageTrack({ s, compact }: { s: Stage; compact?: boolean }) {
  const idx = STAGES.indexOf(s);
  return (
    <div className="flex items-center gap-1" aria-label={`진행 단계 ${s}`}>
      {STAGES.map((st, i) => (
        <div key={st} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <div className={cn("h-1.5 w-full rounded-full transition-colors duration-500", i < idx ? "bg-primary" : i === idx ? "bg-[hsl(33_95%_56%)]" : "bg-muted")} />
          {!compact && <span className={cn("text-[10px]", i === idx ? "font-semibold text-foreground" : "text-muted-foreground")}>{st}</span>}
        </div>
      ))}
    </div>
  );
}

export function SampleTag() {
  return <span className="rounded border border-dashed border-muted-foreground/40 px-1 text-[10px] text-muted-foreground">샘플</span>;
}

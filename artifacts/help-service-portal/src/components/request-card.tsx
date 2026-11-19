import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import type { ServiceRequest } from "@/lib/types";
import { serviceById } from "@/lib/catalog";
import { fmtDate, remainingLabel, slaStatus } from "@/lib/sla";
import { useStore } from "@/lib/store";
import { PriorityBadge, SampleTag, SlaBadge, StageBadge, StageTrack } from "./badges";

export function RequestCard({ r, now }: { r: ServiceRequest; now: number }) {
  const { companyLabel } = useStore();
  const sla = slaStatus(r, now);
  return (
    <Link
      href={`/requests/${r.id}`}
      data-testid={`card-request-${r.id}`}
      className="lift group block rounded-xl border bg-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{r.code}</span>
            <span>{companyLabel(r.companyId)}</span>
            <span>{serviceById(r.serviceId)?.name}</span>
            {r.isSample && <SampleTag />}
          </div>
          <div className="mt-1 truncate font-semibold">{r.title}</div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="mt-3"><StageTrack s={r.stage} /></div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <StageBadge s={r.stage} />
        <PriorityBadge p={r.priority} />
        <SlaBadge s={sla} />
        <span className="ml-auto text-muted-foreground">{remainingLabel(r, now)} · 접수 {fmtDate(r.createdAt)}</span>
      </div>
    </Link>
  );
}

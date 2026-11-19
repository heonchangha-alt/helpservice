import { useState } from "react";
import { Link } from "wouter";
import { SearchX } from "lucide-react";
import { useNow, useStore } from "@/lib/store";
import { STAGES, PRIORITIES } from "@/lib/types";
import { slaStatus, SLA_LABEL, type SlaStatus } from "@/lib/sla";
import { serviceById } from "@/lib/catalog";
import { RequestCard } from "@/components/request-card";
import { EmptyState, PageHeader } from "@/components/page";
import { cn } from "@/lib/utils";

const sel = "h-9 rounded-lg border bg-card px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40";

export default function RequestsPage() {
  const { state } = useStore();
  const now = useNow();
  const [scope, setScope] = useState<"mine" | "all">(state.role === "requester" ? "mine" : "all");
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [priority, setPriority] = useState("");
  const [company, setCompany] = useState("");
  const [sla, setSla] = useState("");

  const list = state.requests.filter((r) => {
    if (scope === "mine" && r.requester !== state.currentUser) return false;
    if (stage && r.stage !== stage) return false;
    if (priority && r.priority !== priority) return false;
    if (company && r.companyId !== company) return false;
    if (sla && slaStatus(r, now) !== sla) return false;
    const t = q.trim().toLowerCase();
    if (t && !`${r.code} ${r.title} ${r.description} ${serviceById(r.serviceId)?.name}`.toLowerCase().includes(t)) return false;
    return true;
  });
  const reset = () => { setQ(""); setStage(""); setPriority(""); setCompany(""); setSla(""); };

  return (
    <div>
      <PageHeader eyebrow="셀프서비스 포털" title="요청 현황" desc="요청 번호, 제목, 서비스명으로 찾고 단계와 SLA 상태로 좁혀 보세요."
        actions={<Link href="/catalog" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">새 요청</Link>} />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-muted p-1">
          {(["mine", "all"] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)} aria-pressed={scope === s} data-testid={`button-scope-${s}`}
              className={cn("rounded-md px-3 py-1 text-xs font-semibold transition-all", scope === s ? "bg-card shadow-sm" : "text-muted-foreground")}>{s === "mine" ? "내 요청" : "전체 요청"}</button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SR 번호, 제목 검색" aria-label="요청 검색" data-testid="input-request-search" className={cn(sel, "min-w-[180px] flex-1")} />
        <select aria-label="단계" value={stage} onChange={(e) => setStage(e.target.value)} className={sel} data-testid="select-stage"><option value="">모든 단계</option>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="우선순위" value={priority} onChange={(e) => setPriority(e.target.value)} className={sel}><option value="">모든 우선순위</option>{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="회사" value={company} onChange={(e) => setCompany(e.target.value)} className={sel}><option value="">모든 회사</option>{state.companies.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        <select aria-label="SLA" value={sla} onChange={(e) => setSla(e.target.value)} className={sel}><option value="">모든 SLA</option>{(Object.keys(SLA_LABEL) as SlaStatus[]).map((s) => <option key={s} value={s}>{SLA_LABEL[s]}</option>)}</select>
      </div>
      <div className="mb-3 text-xs text-muted-foreground" data-testid="text-result-count">{list.length}건</div>
      {list.length === 0 ? (
        <EmptyState icon={SearchX} title="조건에 맞는 요청이 없습니다" desc="필터를 줄이거나 검색어를 바꿔 보세요." action={<button onClick={reset} className="text-sm font-semibold text-primary underline">필터 초기화</button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">{list.map((r) => <RequestCard key={r.id} r={r} now={now} />)}</div>
      )}
    </div>
  );
}

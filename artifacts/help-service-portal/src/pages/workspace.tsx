import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, BookOpen, CheckCheck, Inbox } from "lucide-react";
import { useNow, useStore } from "@/lib/store";
import { AGENTS, ARTICLES, serviceById } from "@/lib/catalog";
import { STAGES, PRIORITIES } from "@/lib/types";
import { isDone, remainingLabel, slaStatus } from "@/lib/sla";
import { PriorityBadge, SampleTag, SlaBadge, StageBadge } from "@/components/badges";
import { EmptyState, PageHeader } from "@/components/page";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type View = "all" | "unassigned" | "alerts" | "done";
const sel = "h-9 rounded-lg border bg-card px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40";

export default function WorkspacePage() {
  const { state, advance, assign, companyLabel } = useStore();
  const { toast } = useToast();
  const now = useNow();
  const [view, setView] = useState<View>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [agent, setAgent] = useState(AGENTS[0]);
  const [focus, setFocus] = useState<string | null>(null);

  const rank = (p: string) => PRIORITIES.indexOf(p as (typeof PRIORITIES)[number]);
  const queue = useMemo(() => {
    return state.requests
      .filter((r) => {
        if (view === "done") return isDone(r);
        if (isDone(r)) return false;
        if (view === "unassigned") return !r.assignee;
        if (view === "alerts") return ["risk", "breached"].includes(slaStatus(r, now));
        return true;
      })
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime() || rank(a.priority) - rank(b.priority));
  }, [state.requests, view, now]);

  const alerts = state.requests.filter((r) => !isDone(r) && ["risk", "breached"].includes(slaStatus(r, now)));
  const counts: Record<View, number> = {
    all: state.requests.filter((r) => !isDone(r)).length,
    unassigned: state.requests.filter((r) => !isDone(r) && !r.assignee).length,
    alerts: alerts.length,
    done: state.requests.filter(isDone).length,
  };
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const valid = selected.filter((id) => queue.some((r) => r.id === id));
  const advanceable = valid.filter((id) => { const r = state.requests.find((x) => x.id === id); return r && !isDone(r); });
  const focused = state.requests.find((r) => r.id === focus) ?? null;
  const related = focused
    ? {
        history: state.requests.filter((r) => r.id !== focused.id && r.serviceId === focused.serviceId).slice(0, 3),
        kb: ARTICLES.filter((a) => a.category === serviceById(focused.serviceId)?.category).slice(0, 2),
      }
    : null;

  return (
    <div>
      <PageHeader eyebrow="상담원 워크스페이스" title="통합 접수 큐" desc="4개사 요청을 기한 순으로 정렬합니다. 여러 건을 선택해 배정하거나 다음 단계로 한 번에 진행하세요. 완료 이후 평가는 요청자만 남길 수 있습니다." />
      {alerts.length > 0 && (
        <div role="status" className="rise mb-5 flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span><b className="text-destructive">SLA 알림 {alerts.length}건</b> · 기한이 25% 미만 남았거나 이미 지난 요청입니다.</span>
          <button onClick={() => setView("alerts")} className="ml-auto text-xs font-bold text-destructive underline">모아 보기</button>
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {([["all", "진행 중"], ["unassigned", "미배정"], ["alerts", "SLA 알림"], ["done", "완료·평가"]] as [View, string][]).map(([v, l]) => (
          <button key={v} onClick={() => { setView(v); setSelected([]); }} aria-pressed={view === v} data-testid={`button-view-${v}`}
            className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors", view === v ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>
            {l} <span className="ml-1 font-mono opacity-70">{counts[v]}</span>
          </button>
        ))}
      </div>

      <div className={cn("sticky top-[61px] z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border bg-card/95 px-3 py-2 backdrop-blur transition-opacity", valid.length ? "opacity-100" : "opacity-60")}>
        <span className="text-sm font-semibold" data-testid="text-selected-count">{valid.length}건 선택</span>
        <select aria-label="배정할 상담원" value={agent} onChange={(e) => setAgent(e.target.value)} className={sel}>{AGENTS.map((a) => <option key={a}>{a}</option>)}</select>
        <button disabled={!valid.length} data-testid="button-batch-assign" onClick={() => { assign(valid, agent); toast({ title: `${valid.length}건을 ${agent}에게 배정했습니다` }); }}
          className="rounded-lg border bg-card px-3 py-1.5 text-sm font-semibold disabled:opacity-40">배정</button>
        <button disabled={!advanceable.length} data-testid="button-batch-advance" onClick={() => { advance(advanceable); toast({ title: `${advanceable.length}건을 다음 단계로 진행했습니다` }); setSelected([]); }}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-40"><CheckCheck className="h-4 w-4" /> 다음 단계로</button>
        {valid.length > 0 && <button onClick={() => setSelected([])} className="ml-auto text-xs text-muted-foreground underline">선택 해제</button>}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        {queue.length === 0 ? (
          <EmptyState icon={Inbox} title="이 보기에는 처리할 요청이 없습니다" desc="다른 보기로 전환하거나 새 요청이 들어올 때까지 기다려 주세요." />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="hidden grid-cols-[32px_1fr_90px_90px_110px_80px] gap-3 border-b bg-secondary/60 px-4 py-2 text-[11px] font-semibold text-muted-foreground md:grid">
              <input type="checkbox" aria-label="전체 선택" checked={valid.length === queue.length} onChange={(e) => setSelected(e.target.checked ? queue.map((r) => r.id) : [])} className="accent-[hsl(229_58%_30%)]" />
              <span>요청</span><span>단계</span><span>우선순위</span><span>SLA</span><span>담당</span>
            </div>
            {queue.map((r) => (
              <div key={r.id} data-testid={`row-queue-${r.id}`} onClick={() => setFocus(r.id)}
                className={cn("grid cursor-pointer grid-cols-[32px_1fr] gap-3 border-b px-4 py-3 text-sm transition-colors last:border-0 md:grid-cols-[32px_1fr_90px_90px_110px_80px] md:items-center", focus === r.id ? "bg-accent/50" : "hover:bg-secondary/50", selected.includes(r.id) && "bg-primary/5")}>
                <input type="checkbox" aria-label={`${r.code} 선택`} checked={selected.includes(r.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggle(r.id)} className="accent-[hsl(229_58%_30%)]" data-testid={`checkbox-${r.id}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><span className="font-mono">{r.code}</span>{companyLabel(r.companyId)}{r.isSample && <SampleTag />}</div>
                  <Link href={`/requests/${r.id}`} onClick={(e) => e.stopPropagation()} className="block truncate font-semibold hover:underline">{r.title}</Link>
                  <div className="text-[11px] text-muted-foreground">{remainingLabel(r, now)}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5 md:hidden"><StageBadge s={r.stage} /><PriorityBadge p={r.priority} /><SlaBadge s={slaStatus(r, now)} /><span className="text-xs">{r.assignee ?? "미배정"}</span></div>
                </div>
                <div className="hidden md:block"><StageBadge s={r.stage} /></div>
                <div className="hidden md:block"><PriorityBadge p={r.priority} /></div>
                <div className="hidden md:block"><SlaBadge s={slaStatus(r, now)} /></div>
                <div className={cn("hidden text-xs md:block", !r.assignee && "font-semibold text-[hsl(26_80%_40%)]")}>{r.assignee ?? "미배정"}</div>
              </div>
            ))}
          </div>
        )}
        <aside className="rounded-xl border bg-card p-4 xl:sticky xl:top-[120px] xl:self-start">
          <h2 className="text-sm font-bold">과거 이력 · 지식</h2>
          {!focused || !related ? (
            <p className="mt-2 text-xs text-muted-foreground">큐에서 요청을 선택하면 같은 서비스의 과거 요청과 관련 지식 문서를 보여 줍니다.</p>
          ) : (
            <div className="mt-3 space-y-4 text-sm">
              <div className="rounded-lg bg-secondary/60 p-3"><div className="font-mono text-[11px] text-muted-foreground">{focused.code} · {STAGES.indexOf(focused.stage) + 1}/6</div><div className="font-semibold">{focused.title}</div></div>
              <div>
                <div className="mb-1 text-[11px] font-semibold text-muted-foreground">같은 서비스 과거 요청</div>
                {related.history.length === 0 ? <p className="text-xs text-muted-foreground">이력이 없습니다.</p> : related.history.map((h) => (
                  <Link key={h.id} href={`/requests/${h.id}`} className="flex justify-between gap-2 rounded px-1 py-1 text-xs hover:bg-secondary"><span className="truncate">{h.title}</span><span className="shrink-0 text-muted-foreground">{h.stage}</span></Link>
                ))}
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold text-muted-foreground">관련 지식 문서</div>
                {related.kb.length === 0 ? <p className="text-xs text-muted-foreground">관련 문서가 없습니다.</p> : related.kb.map((a) => (
                  <Link key={a.id} href={`/knowledge/${a.id}`} className="flex items-center gap-1.5 rounded px-1 py-1 text-xs hover:bg-secondary"><BookOpen className="h-3 w-3 text-primary" />{a.title}</Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

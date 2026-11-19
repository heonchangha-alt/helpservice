import { useState } from "react";
import { Link } from "wouter";
import { useNow, useStore } from "@/lib/store";
import { AGENTS } from "@/lib/catalog";
import { STAGES } from "@/lib/types";
import { formatDuration, isDone, leadTime, slaStatus } from "@/lib/sla";
import { PageHeader, Stat } from "@/components/page";
import { SlaBadge } from "@/components/badges";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { state, companyLabel } = useStore();
  const now = useNow();
  const [company, setCompany] = useState("");
  const rs = state.requests.filter((r) => !company || r.companyId === company);
  const open = rs.filter((r) => !isDone(r));
  const done = rs.filter(isDone);
  const st = rs.map((r) => slaStatus(r, now));
  const met = st.filter((s) => s === "met").length;
  const breachedAll = st.filter((s) => s === "breached").length;
  const closedBreached = done.filter((r) => slaStatus(r, now) === "breached").length;
  const risk = open.filter((r) => slaStatus(r, now) === "risk").length;
  const openBreached = open.filter((r) => slaStatus(r, now) === "breached").length;
  const rate = done.length ? ((met / done.length) * 100).toFixed(1) + "%" : "-";
  const lts = done.map(leadTime).filter((x): x is number => x !== null);
  const avgLt = lts.length ? formatDuration(lts.reduce((a, b) => a + b, 0) / lts.length) : "-";
  const ratings = rs.filter((r) => r.rating !== null).map((r) => r.rating!);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : "-";

  const agents = [...AGENTS, null].map((a) => {
    const list = open.filter((r) => r.assignee === a);
    return { name: a ?? "미배정", open: list.length, alert: list.filter((r) => slaStatus(r, now) !== "ok").length };
  });
  const maxLoad = Math.max(1, ...agents.map((a) => a.open));
  const companies = state.companies.map((c) => {
    const list = state.requests.filter((r) => r.companyId === c.id);
    const d = list.filter(isDone);
    const m = d.filter((r) => slaStatus(r, now) === "met").length;
    return { ...c, total: list.length, open: list.filter((r) => !isDone(r)).length, rate: d.length ? `${((m / d.length) * 100).toFixed(1)}%` : "-", breached: list.filter((r) => slaStatus(r, now) === "breached").length };
  });
  const watch = open.filter((r) => slaStatus(r, now) !== "ok").sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt));

  return (
    <div>
      <PageHeader eyebrow="운영 대시보드" title="SLA · 업무 현황" desc="모든 수치는 서버 데이터베이스에 저장된 요청의 실제 타임스탬프로 계산합니다. 5초마다 최신 상태를 조회합니다."
        actions={
          <select aria-label="회사 필터" data-testid="select-dashboard-company" value={company} onChange={(e) => setCompany(e.target.value)} className="h-9 rounded-lg border bg-card px-3 text-sm">
            <option value="">그룹 통합</option>{state.companies.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        } />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="완료 건 SLA 달성률" value={rate} hint={`완료 ${done.length}건 중 기한 내 ${met}건`} tone="good" />
        <Stat label="진행 중 임박" value={risk} hint="잔여 기한 25% 미만" tone="warn" />
        <Stat label="위반" value={breachedAll} hint={`진행 중 ${openBreached} · 완료 ${closedBreached}`} tone="danger" />
        <Stat label="평균 리드타임" value={avgLt} hint={`만족도 평균 ${avgRating} / 5`} />
      </div>

      <section className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="font-bold">작업 진행 현황</h2>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STAGES.map((s) => {
            const n = rs.filter((r) => r.stage === s).length;
            return (
              <Link key={s} href="/requests" className="rounded-lg border p-3 transition-colors hover:bg-secondary">
                <div className="text-xs text-muted-foreground">{s}</div>
                <div className="font-mono text-xl font-semibold">{n}</div>
                <div className="mt-2 h-1 rounded-full bg-muted"><div className="h-1 origin-left rounded-full bg-primary transition-transform duration-700" style={{ transform: `scaleX(${rs.length ? n / rs.length : 0})` }} /></div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-bold">팀 · 개인 업무 부하</h2>
          <p className="text-xs text-muted-foreground">진행 중 요청 기준</p>
          <ul className="mt-4 space-y-3">
            {agents.map((a) => (
              <li key={a.name} className="text-sm">
                <div className="flex justify-between"><span className={cn(a.name === "미배정" && "font-semibold text-[hsl(26_80%_40%)]")}>{a.name}</span><span className="font-mono text-xs">{a.open}건{a.alert ? ` · 알림 ${a.alert}` : ""}</span></div>
                <div className="mt-1 h-2 rounded-full bg-muted"><div className={cn("h-2 origin-left rounded-full transition-transform duration-700", a.alert ? "bg-[hsl(33_95%_56%)]" : "bg-primary")} style={{ transform: `scaleX(${a.open / maxLoad})` }} /></div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-bold">회사별 통합 뷰</h2>
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-left text-[11px] text-muted-foreground"><th className="py-2 font-semibold">회사</th><th className="font-semibold">전체</th><th className="font-semibold">진행</th><th className="font-semibold">달성률</th><th className="font-semibold">위반</th></tr></thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className={cn("border-t", company === c.id && "bg-accent/50")}>
                  <td className="py-2.5"><button onClick={() => setCompany(company === c.id ? "" : c.id)} className="font-semibold hover:underline">{c.label}</button></td>
                  <td className="font-mono">{c.total}</td><td className="font-mono">{c.open}</td><td className="font-mono">{c.rate}</td><td className={cn("font-mono", c.breached && "text-destructive")}>{c.breached}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="font-bold">주의 대상 요청</h2>
        {watch.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">임박하거나 위반된 진행 중 요청이 없습니다.</p> : (
          <ul className="mt-3 divide-y">
            {watch.map((r) => (
              <li key={r.id}><Link href={`/requests/${r.id}`} className="flex flex-wrap items-center gap-3 py-2.5 text-sm hover:bg-secondary/50"><span className="font-mono text-xs">{r.code}</span><span className="flex-1 truncate">{r.title}</span><span className="text-xs text-muted-foreground">{companyLabel(r.companyId)} · {r.assignee ?? "미배정"}</span><SlaBadge s={slaStatus(r, now)} /></Link></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

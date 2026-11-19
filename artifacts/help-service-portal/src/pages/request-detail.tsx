import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, FileQuestion, Star } from "lucide-react";
import { useNow, useStore } from "@/lib/store";
import { serviceById } from "@/lib/catalog";
import { STAGES } from "@/lib/types";
import { fmtDate, formatDuration, leadTime, remainingLabel, slaStatus, stageDurations } from "@/lib/sla";
import { PriorityBadge, SampleTag, SlaBadge, StageBadge, StageTrack } from "@/components/badges";
import { EmptyState } from "@/components/page";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function RatingForm({ id }: { id: string }) {
  const { rate } = useStore();
  const { toast } = useToast();
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const labels = ["", "매우 불만족", "불만족", "보통", "만족", "매우 만족"];
  return (
    <form
      className="rounded-xl border border-[hsl(33_80%_70%)] bg-accent/60 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!score) return setErr("별점을 선택해 주세요.");
        if (text.trim().length < 2) return setErr("한 줄 의견을 남겨 주세요.");
        if (await rate(id, score, text.trim())) {
          toast({ title: "평가가 기록되었습니다", description: "요청이 최종 종료되었습니다." });
        }
      }}
    >
      <div className="font-bold">처리 결과는 어떠셨나요?</div>
      <p className="text-xs text-muted-foreground">평가를 남기면 요청이 '평가' 단계로 종료됩니다.</p>
      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="만족도" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} role="radio" aria-checked={score === n} aria-label={`${n}점`} data-testid={`button-star-${n}`}
            onMouseEnter={() => setHover(n)} onClick={() => { setScore(n); setErr(""); }} className="p-0.5 transition-transform hover:scale-110">
            <Star className={cn("h-7 w-7 transition-colors", (hover || score) >= n ? "fill-[hsl(33_95%_56%)] text-[hsl(33_95%_50%)]" : "text-muted-foreground/40")} />
          </button>
        ))}
        <span className="ml-2 text-sm font-semibold">{labels[hover || score]}</span>
      </div>
      <textarea data-testid="input-feedback" value={text} onChange={(e) => setText(e.target.value)} rows={2} aria-label="의견" placeholder="좋았던 점이나 아쉬운 점을 알려 주세요"
        className="mt-3 w-full rounded-lg border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring/40" />
      {err && <p role="alert" className="mt-1 text-xs text-destructive">{err}</p>}
      <button type="submit" data-testid="button-submit-rating" className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">평가 제출</button>
    </form>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, companyLabel, advance } = useStore();
  const now = useNow(15000);
  const r = state.requests.find((x) => x.id === id);
  if (!r) return <EmptyState icon={FileQuestion} title="요청을 찾을 수 없습니다" desc="삭제되었거나 잘못된 주소입니다. 데모 데이터를 초기화했다면 번호가 달라졌을 수 있습니다." action={<Link href="/requests" className="text-sm font-semibold text-primary underline">요청 목록으로</Link>} />;
  const svc = serviceById(r.serviceId);
  const durations = stageDurations(r, now);
  const lt = leadTime(r);
  const canAgent = state.role !== "requester" && STAGES.indexOf(r.stage) < STAGES.indexOf("완료");
  const canRate = r.stage === "완료" && state.role === "requester" && r.requester === state.currentUser;

  return (
    <div className="space-y-6">
      <Link href="/requests" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> 요청 현황</Link>
      <header className="rise rounded-2xl border bg-card p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">{r.code}</span><span>{companyLabel(r.companyId)}</span><span>{svc?.category} / {svc?.name}</span>{r.isSample && <SampleTag />}
        </div>
        <h1 className="mt-2 text-2xl font-bold" data-testid="text-request-title">{r.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2"><StageBadge s={r.stage} /><PriorityBadge p={r.priority} /><SlaBadge s={slaStatus(r, now)} /><span className="text-xs text-muted-foreground">{remainingLabel(r, now)}</span></div>
        <div className="mt-5"><StageTrack s={r.stage} /></div>
        {canAgent && (
          <button onClick={() => advance([r.id])} data-testid="button-advance" className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
            {STAGES[STAGES.indexOf(r.stage) + 1]} 단계로 진행
          </button>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="font-bold">단계별 처리 기록</h2>
          <p className="text-xs text-muted-foreground">각 단계에 머문 시간은 기록된 전환 시각으로 계산합니다.</p>
          <ol className="mt-5 space-y-0">
            {STAGES.map((st, i) => {
              const d = durations.find((x) => x.stage === st);
              return (
                <li key={st} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < STAGES.length - 1 && <span className={cn("absolute left-[9px] top-5 bottom-0 w-px", d ? "bg-primary/40" : "bg-border")} />}
                  <span className={cn("relative mt-0.5 h-[19px] w-[19px] shrink-0 rounded-full border-2", d?.current ? "border-[hsl(33_95%_50%)] bg-accent" : d ? "border-primary bg-primary" : "border-border bg-card")} />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={cn("text-sm font-semibold", !d && "text-muted-foreground")}>{st}</span>
                      {d && <span className="font-mono text-xs">{d.stage === "평가" ? "종료" : `${formatDuration(d.ms)}${d.current ? " 경과" : ""}`}</span>}
                    </div>
                    {d ? <div className="text-xs text-muted-foreground">{fmtDate(d.at)} · {d.by}</div> : <div className="text-xs text-muted-foreground">대기</div>}
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
            <div><div className="text-xs text-muted-foreground">처리 기한</div><div className="font-mono">{fmtDate(r.dueAt)}</div></div>
            <div><div className="text-xs text-muted-foreground">접수부터 완료까지</div><div className="font-mono">{lt === null ? "진행 중" : formatDuration(lt)}</div></div>
          </div>
        </section>
        <section className="space-y-4">
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-bold">요청 내용</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">요청자</dt><dd>{r.requester}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">담당자</dt><dd>{r.assignee ?? "미배정"}</dd></div>
              {svc?.fields.map((f) => <div key={f.key} className="flex justify-between gap-3"><dt className="text-muted-foreground">{f.label}</dt><dd className="text-right">{r.fields[f.key] || "-"}</dd></div>)}
            </dl>
            {r.description && <p className="mt-4 whitespace-pre-wrap rounded-lg bg-secondary/60 p-3 text-sm">{r.description}</p>}
          </div>
          {canRate && <RatingForm id={r.id} />}
          {r.stage === "완료" && !canRate && <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">요청자의 만족도 평가를 기다리고 있습니다. 평가 단계는 요청자 화면에서만 진행됩니다.</div>}
          {r.rating !== null && (
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="font-bold">만족도 평가</h2>
              <div className="mt-2 flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("h-5 w-5", r.rating! >= n ? "fill-[hsl(33_95%_56%)] text-[hsl(33_95%_50%)]" : "text-muted-foreground/30")} />)}</div>
              <p className="mt-2 text-sm">{r.feedback}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import { Link } from "wouter";
import { ArrowRight, BookOpen, Inbox, Star } from "lucide-react";
import { useNow, useStore } from "@/lib/store";
import { ARTICLES, SERVICES } from "@/lib/catalog";
import { isDone, slaStatus } from "@/lib/sla";
import { RequestCard } from "@/components/request-card";
import { EmptyState } from "@/components/page";

export default function HomePage() {
  const { state } = useStore();
  const now = useNow();
  const mine = state.requests.filter((r) => r.requester === state.currentUser);
  const open = mine.filter((r) => !isDone(r));
  const toRate = mine.filter((r) => r.stage === "완료");
  const risky = open.filter((r) => ["risk", "breached"].includes(slaStatus(r, now))).length;

  return (
    <div className="space-y-8">
      <section className="rise relative overflow-hidden rounded-2xl bg-primary px-6 py-8 text-primary-foreground md:px-10 md:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border-[28px] border-[hsl(33_95%_56%/0.9)]" />
        <div className="pointer-events-none absolute right-24 bottom-[-60px] h-40 w-40 rounded-full border-[14px] border-primary-foreground/10" />
        <div className="relative max-w-xl">
          <div className="text-xs font-semibold text-[hsl(33_95%_70%)]">셀프서비스 포털</div>
          <h1 className="mt-2 text-[26px] font-bold leading-snug md:text-[34px]">{state.currentUser}님, 요청이 지금 어디에 있는지 바로 확인하세요.</h1>
          <p className="mt-2 text-sm text-primary-foreground/75">접수부터 평가까지 모든 단계의 시각과 소요 시간을 기록합니다.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/catalog" data-testid="link-hero-catalog" className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(33_95%_56%)] px-4 py-2.5 text-sm font-bold text-[hsl(229_52%_14%)] transition-transform hover:-translate-y-0.5">새 요청 작성 <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/knowledge" data-testid="link-hero-knowledge" className="inline-flex items-center gap-1.5 rounded-lg border border-primary-foreground/25 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-foreground/10">먼저 해결 방법 찾기</Link>
          </div>
        </div>
        <dl className="relative mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-primary-foreground/15 pt-5">
          <div><dt className="text-[11px] text-primary-foreground/60">진행 중</dt><dd data-testid="text-open-count" className="font-mono text-2xl font-semibold">{open.length}</dd></div>
          <div><dt className="text-[11px] text-primary-foreground/60">기한 임박·초과</dt><dd className="font-mono text-2xl font-semibold text-[hsl(33_95%_70%)]">{risky}</dd></div>
          <div><dt className="text-[11px] text-primary-foreground/60">평가 대기</dt><dd className="font-mono text-2xl font-semibold">{toRate.length}</dd></div>
        </dl>
      </section>

      {toRate.length > 0 && (
        <section className="rise flex flex-col gap-3 rounded-xl border border-[hsl(33_80%_70%)] bg-accent p-4 sm:flex-row sm:items-center">
          <Star className="h-5 w-5 text-accent-foreground" />
          <div className="flex-1 text-sm text-accent-foreground"><b>{toRate.length}건</b>의 요청이 완료되었습니다. 만족도를 남겨야 요청이 최종 종료됩니다.</div>
          <Link href={`/requests/${toRate[0].id}`} className="text-sm font-bold text-accent-foreground underline underline-offset-4">평가하러 가기</Link>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-bold">내 진행 중 요청</h2>
            <Link href="/requests" className="text-sm font-semibold text-primary hover:underline">전체 보기</Link>
          </div>
          <div className="space-y-3">
            {open.length === 0 ? (
              <EmptyState icon={Inbox} title="진행 중인 요청이 없습니다" desc="필요한 서비스를 카탈로그에서 골라 요청해 보세요." action={<Link href="/catalog" className="text-sm font-semibold text-primary underline">카탈로그 열기</Link>} />
            ) : (
              open.slice(0, 4).map((r) => <RequestCard key={r.id} r={r} now={now} />)
            )}
          </div>
        </section>
        <aside className="space-y-6">
          <section>
            <h2 className="mb-3 text-lg font-bold">자주 찾는 서비스</h2>
            <div className="divide-y rounded-xl border bg-card">
              {SERVICES.slice(0, 5).map((s) => (
                <Link key={s.id} href={`/catalog?service=${s.id}`} data-testid={`link-quick-${s.id}`} className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-secondary/60">
                  <div>
                    <div className="text-sm font-semibold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.category}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-bold">요청 전에 확인해 보세요</h2>
            <div className="space-y-2">
              {ARTICLES.slice(0, 3).map((a) => (
                <Link key={a.id} href={`/knowledge/${a.id}`} className="lift flex gap-3 rounded-lg border bg-card p-3">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-semibold">{a.title}</div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">{a.summary}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

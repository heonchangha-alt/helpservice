import { useEffect, useState } from "react";
import { Link, useParams, useSearch } from "wouter";
import { ArrowLeft, BookOpen, FileQuestion, Search } from "lucide-react";
import { ARTICLES, SERVICES } from "@/lib/catalog";
import { EmptyState, PageHeader } from "@/components/page";

export function KnowledgeListPage() {
  const search = useSearch();
  const [q, setQ] = useState("");
  useEffect(() => { setQ(new URLSearchParams(search).get("q") ?? ""); }, [search]);
  const t = q.trim().toLowerCase();
  const list = ARTICLES.filter((a) => !t || `${a.title} ${a.summary} ${a.body.join(" ")} ${a.category}`.toLowerCase().includes(t));
  return (
    <div>
      <PageHeader eyebrow="셀프서비스 포털" title="지식 검색" desc="내장된 데모 문서입니다. Confluence는 미연결 상태이며 실제 사내 문서가 아닙니다." />
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} data-testid="input-knowledge-search" aria-label="지식 문서 검색" placeholder="증상이나 키워드를 입력하세요"
          className="h-12 w-full rounded-xl border bg-card pl-12 pr-4 text-base outline-none focus:ring-2 focus:ring-ring/40" />
      </div>
      {list.length === 0 ? (
        <EmptyState icon={FileQuestion} title={`'${q}'에 대한 문서가 없습니다`} desc="해결 방법을 찾지 못했다면 서비스 요청으로 남겨 주세요." action={<Link href="/catalog" className="text-sm font-semibold text-primary underline">요청하러 가기</Link>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((a) => (
            <Link key={a.id} href={`/knowledge/${a.id}`} data-testid={`card-article-${a.id}`} className="lift rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground"><span className="font-semibold text-[hsl(26_80%_40%)]">{a.category}</span><span>데모 문서 · {a.updated}</span></div>
              <div className="mt-1 font-bold">{a.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{a.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function KnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const a = ARTICLES.find((x) => x.id === id);
  if (!a) return <EmptyState icon={BookOpen} title="문서를 찾을 수 없습니다" desc="주소를 확인하거나 목록에서 다시 선택해 주세요." action={<Link href="/knowledge" className="text-sm font-semibold text-primary underline">지식 검색으로</Link>} />;
  const svc = SERVICES.find((s) => s.category === a.category);
  return (
    <article className="mx-auto max-w-2xl">
      <Link href="/knowledge" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> 지식 검색</Link>
      <div className="rise mt-4 text-xs font-semibold text-[hsl(26_80%_40%)]">{a.category} · 데모 문서</div>
      <h1 className="mt-1 text-2xl font-bold">{a.title}</h1>
      <p className="mt-2 text-muted-foreground">{a.summary}</p>
      <ol className="mt-6 space-y-4">
        {a.body.map((p, i) => (
          <li key={i} className="flex gap-4 rounded-xl border bg-card p-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">{i + 1}</span>
            <p className="text-sm leading-relaxed">{p}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-col gap-3 rounded-xl bg-secondary p-5 sm:flex-row sm:items-center">
        <div className="flex-1 text-sm">해결되지 않았나요? 상담원에게 요청하면 처리 단계를 모두 확인할 수 있습니다.</div>
        {svc && <Link href={`/catalog?service=${svc.id}`} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{svc.name} 요청</Link>}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">최종 수정 {a.updated} · 조회 {a.views.toLocaleString()}회 (데모 값)</p>
    </article>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useSearch } from "wouter";
import { Clock, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES, SERVICES, serviceById } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { PRIORITIES, SLA_HOURS, type Priority, type ServiceDef } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState, PageHeader } from "@/components/page";

const inputCls = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40";

function RequestForm({ service, onDone }: { service: ServiceDef; onDone: (id: string) => void }) {
  const { state, createRequest } = useStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [companyId, setCompanyId] = useState(state.companies[0]?.id ?? "");
  const [priority, setPriority] = useState<Priority>(service.defaultPriority);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (title.trim().length < 4) err.title = "제목을 4자 이상 입력해 주세요.";
    service.fields.forEach((f) => { if (f.required && !fields[f.key]?.trim()) err[f.key] = `${f.label}을(를) 입력해 주세요.`; });
    setErrors(err);
    if (Object.keys(err).length) return;
    const r = await createRequest({ title: title.trim(), description: description.trim(), companyId, serviceId: service.id, fields, priority });
    if (r) onDone(r.id);
  };

  const err = (k: string) => errors[k] && <p role="alert" className="mt-1 text-xs text-destructive">{errors[k]}</p>;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">소속 회사
          <select data-testid="select-company" value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={cn(inputCls, "mt-1")}>
            {state.companies.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <div className="text-sm font-medium">우선순위
          <div className="mt-1 grid grid-cols-4 gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="우선순위">
            {PRIORITIES.map((p) => (
              <button type="button" key={p} role="radio" aria-checked={priority === p} data-testid={`radio-priority-${p}`} onClick={() => setPriority(p)}
                className={cn("rounded-md py-1.5 text-xs font-semibold transition-all", priority === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>{p}</button>
            ))}
          </div>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> 처리 목표 {SLA_HOURS[priority]}시간</p>
        </div>
      </div>
      <label className="block text-sm font-medium">제목
        <input data-testid="input-title" value={title} onChange={(e) => setTitle(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="한 줄로 요약해 주세요" />
        {err("title")}
      </label>
      <div className="rounded-xl border border-dashed bg-secondary/40 p-4">
        <div className="mb-3 text-xs font-semibold text-muted-foreground">{service.category} 항목</div>
        <div className="grid gap-4 sm:grid-cols-2">
          {service.fields.map((f) => (
            <label key={f.key} className="block text-sm font-medium">
              {f.label}{f.required && <span className="text-destructive"> *</span>}
              {f.type === "select" ? (
                <select data-testid={`select-field-${f.key}`} value={fields[f.key] ?? ""} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} className={cn(inputCls, "mt-1")}>
                  <option value="">선택</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input data-testid={`input-field-${f.key}`} type={f.type} value={fields[f.key] ?? ""} placeholder={f.type === "text" ? f.placeholder : undefined}
                  onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} className={cn(inputCls, "mt-1")} />
              )}
              {err(f.key)}
            </label>
          ))}
        </div>
      </div>
      <label className="block text-sm font-medium">상세 내용
        <textarea data-testid="input-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring/40" placeholder="상황, 발생 시점, 이미 시도한 방법을 적어 주세요" />
      </label>
      <div className="flex justify-end">
        <button type="submit" data-testid="button-submit-request" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]">요청 접수</button>
      </div>
    </form>
  );
}

export default function CatalogPage() {
  const search = useSearch();
  const [, setLoc] = useLocation();
  const { toast } = useToast();
  const [cat, setCat] = useState<string>("전체");
  const [q, setQ] = useState("");
  const [active, setActive] = useState<ServiceDef | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(search).get("service");
    if (id) setActive(serviceById(id) ?? null);
  }, [search]);

  const list = SERVICES.filter((s) => (cat === "전체" || s.category === cat) && (s.name + s.summary).includes(q.trim()));

  return (
    <div>
      <PageHeader eyebrow="셀프서비스 포털" title="서비스 카탈로그" desc="4개사 공통 IT 서비스입니다. 서비스를 고르면 해당 분류에 맞는 항목만 요청서에 나타납니다." />
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex flex-wrap gap-1.5">
          {["전체", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCat(c)} data-testid={`button-cat-${c}`} aria-pressed={cat === c}
              className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors", cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>{c}</button>
          ))}
        </div>
        <div className="relative md:ml-auto md:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} data-testid="input-catalog-search" placeholder="서비스 검색" aria-label="서비스 검색" className={cn(inputCls, "pl-9")} />
        </div>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Search} title="찾는 서비스가 없습니다" desc="다른 검색어를 입력하거나 분류를 '전체'로 바꿔 보세요." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s, i) => (
            <button key={s.id} onClick={() => setActive(s)} data-testid={`card-service-${s.id}`} style={{ animationDelay: `${i * 40}ms` }}
              className="rise lift group flex flex-col rounded-xl border bg-card p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="text-[11px] font-semibold text-[hsl(26_80%_40%)]">{s.category}</span>
              <span className="mt-1 font-bold">{s.name}</span>
              <span className="mt-1 flex-1 text-sm text-muted-foreground">{s.summary}</span>
              <span className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                <span>기본 {s.defaultPriority} · {SLA_HOURS[s.defaultPriority]}시간 목표</span>
                <span className="font-semibold text-primary transition-transform group-hover:translate-x-0.5">요청하기</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <Dialog open={!!active} onOpenChange={(o) => { if (!o) { setActive(null); if (search) setLoc("/catalog"); } }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle>{active.name}</DialogTitle>
                <DialogDescription>{active.summary}</DialogDescription>
              </DialogHeader>
              <RequestForm key={active.id} service={active} onDone={(id) => {
                setActive(null);
                toast({ title: "요청이 접수되었습니다", description: "상세 화면에서 진행 단계를 확인할 수 있습니다." });
                setLoc(`/requests/${id}`);
              }} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

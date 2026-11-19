import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Bell, BookOpen, Gauge, Headset, Home, LayoutGrid, ListChecks, Menu, Search, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { ROLE_LABEL, type Role } from "@/lib/types";

const NAV = [
  { href: "/", label: "홈", icon: Home, group: "셀프서비스 포털" },
  { href: "/catalog", label: "서비스 카탈로그", icon: LayoutGrid, group: "셀프서비스 포털" },
  { href: "/requests", label: "요청 현황", icon: ListChecks, group: "셀프서비스 포털" },
  { href: "/knowledge", label: "지식 검색", icon: BookOpen, group: "셀프서비스 포털" },
  { href: "/notifications", label: "알림 수신함", icon: Bell, group: "셀프서비스 포털" },
  { href: "/workspace", label: "상담원 워크스페이스", icon: Headset, group: "처리 · 운영" },
  { href: "/dashboard", label: "운영 대시보드", icon: Gauge, group: "처리 · 운영" },
  { href: "/settings", label: "설정", icon: Settings, group: "시스템" },
];

const ROLE_HOME: Record<Role, string> = { requester: "/", agent: "/workspace", manager: "/dashboard" };

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [loc, setLoc] = useLocation();
  const { state, setRole } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;
  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-primary font-mono text-sm font-bold text-sidebar-primary-foreground">DG</div>
          <div>
            <div className="text-[15px] font-bold leading-tight">헬프 서비스 포털</div>
            <div className="text-[11px] text-sidebar-foreground/60">디스커버리 그룹 4개사 공용</div>
          </div>
        </div>
      </div>
      <div className="mx-4 mb-4 rounded-lg bg-sidebar-accent p-1" role="radiogroup" aria-label="미리보기 역할">
        <div className="grid grid-cols-3 gap-1">
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <button
              key={r}
              role="radio"
              aria-checked={state.role === r}
              data-testid={`button-role-${r}`}
              onClick={() => { setRole(r); setLoc(ROLE_HOME[r]); onNavigate?.(); }}
              className={cn("rounded-md py-1.5 text-xs font-semibold transition-all", state.role === r ? "bg-sidebar-primary text-sidebar-primary-foreground shadow" : "text-sidebar-foreground/70 hover:text-sidebar-foreground")}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
        <div className="px-1 pt-1.5 pb-0.5 text-[10px] text-sidebar-foreground/50">역할 전환은 미리보기용이며 권한 제어가 아닙니다</div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3">
        {groups.map((g) => (
          <div key={g} className="mb-4">
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">{g}</div>
            {NAV.filter((n) => n.group === g).map((n) => {
              const active = n.href === "/" ? loc === "/" : loc.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={onNavigate}
                  data-testid={`link-nav-${n.href.slice(1) || "home"}`}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    active ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-sidebar-primary" />}
                  <n.icon className="h-4 w-4" />
                  {n.label}
                  {n.href === "/notifications" && unread > 0 && (
                    <span className="ml-auto rounded-full bg-sidebar-primary px-1.5 font-mono text-[10px] font-bold text-sidebar-primary-foreground">{unread}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border px-5 py-4 text-[11px] text-sidebar-foreground/60">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" /> 공용 데모 · 서버 DB 저장
        </div>
        <div className="mt-1">SSO · Jira · Confluence 미연결</div>
        <div className="mt-1">로그인 미적용 · 실제 업무정보 입력 금지</div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [, setLoc] = useLocation();
  const { state, loadError, dismissError, legacyCount, legacyError } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    setLoc(term ? `/knowledge?q=${encodeURIComponent(term)}` : "/knowledge");
  };

  return (
    <div className="paper-grain min-h-[100dvh] bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block"><Sidebar /></aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="메뉴">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="rise absolute inset-y-0 left-0 w-72">
            <Sidebar onNavigate={() => setOpen(false)} />
            <button aria-label="메뉴 닫기" onClick={() => setOpen(false)} className="absolute right-3 top-6 text-sidebar-foreground"><X className="h-5 w-5" /></button>
          </div>
        </div>
      )}
      <div className="relative z-10 lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur md:px-8">
          <button className="lg:hidden" aria-label="메뉴 열기" data-testid="button-menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <form onSubmit={submit} className="relative max-w-md flex-1" role="search">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              data-testid="input-global-search"
              placeholder="무엇을 도와드릴까요? 예: VPN, 비밀번호"
              aria-label="지식 검색"
              className="h-9 w-full rounded-lg border bg-card pl-9 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
            />
          </form>
          <div className="ml-auto flex items-center gap-3">
            <span data-testid="status-demo" className="hidden rounded-full border border-dashed border-[hsl(26_80%_50%)] px-2 py-0.5 text-[11px] font-semibold text-[hsl(26_80%_36%)] sm:inline">데모 환경</span>
            <Link href="/notifications" aria-label={`알림 ${unread}건`} data-testid="link-bell" className="relative grid h-9 w-9 place-items-center rounded-lg border bg-card transition-colors hover:bg-secondary">
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[hsl(33_95%_56%)] px-1 font-mono text-[10px] font-bold text-[hsl(229_52%_14%)]">{unread}</span>}
            </Link>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{state.currentUser.slice(1)}</div>
              <div className="hidden text-xs leading-tight md:block">
                <div className="font-semibold">{state.currentUser}</div>
                <div className="text-muted-foreground">{ROLE_LABEL[state.role]} 미리보기</div>
              </div>
            </div>
          </div>
        </header>
        {loadError && (
          <div role="alert" className="mx-4 mt-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive md:mx-8">
            {loadError}
            <button onClick={dismissError} className="font-semibold underline">닫기</button>
          </div>
        )}
        {(legacyCount > 0 || legacyError) && (
          <div className="mx-4 mt-4 rounded-lg border bg-accent/60 px-4 py-3 text-sm md:mx-8">
            {legacyError ?? `이전 브라우저에 직접 만든 요청 ${legacyCount}건이 남아 있습니다. 원본은 보존되어 있으며, 설정에서 공용 DB로 가져올 수 있습니다.`}
            <Link href="/settings" className="ml-2 font-semibold underline">설정에서 확인</Link>
          </div>
        )}
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

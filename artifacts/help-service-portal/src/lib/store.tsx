import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPortal, getGetPortalQueryKey, createPortalRequest, batchPortalRequests, ratePortalRequest,
  savePortalCompanies, readPortalNotifications, importPortalRequests,
  type PortalSnapshot,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import type { AppState, Company, Priority, Role, ServiceRequest } from "./types";

const LEGACY_KEY = "dg-help-portal-v1";
const ROLE_KEY = "dg-help-preview-role";
const DEMO_USER = "김하늘";
const message = (e: unknown) => e instanceof Error ? e.message : "서버에 연결하지 못했습니다.";

export interface NewRequestInput {
  title: string;
  description: string;
  companyId: string;
  serviceId: string;
  fields: Record<string, string>;
  priority: Priority;
}
interface Store {
  state: AppState;
  isSaving: boolean;
  loadError: string | null;
  dismissError: () => void;
  setRole: (r: Role) => void;
  createRequest: (i: NewRequestInput) => Promise<ServiceRequest | null>;
  advance: (ids: string[]) => Promise<boolean>;
  assign: (ids: string[], agent: string) => Promise<boolean>;
  rate: (id: string, rating: number, feedback: string) => Promise<boolean>;
  markRead: (id: string) => Promise<boolean>;
  markAllRead: () => Promise<boolean>;
  saveCompanies: (companies: Company[]) => Promise<boolean>;
  companyLabel: (id: string) => string;
  legacyCount: number;
  legacyError: string | null;
  importLegacy: () => Promise<boolean>;
}
const Ctx = createContext<Store | null>(null);

function legacyData(): { requests: ServiceRequest[]; error: string | null } {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return { requests: [], error: null };
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.requests)) throw new Error("invalid");
    return { requests: data.requests.filter((r: ServiceRequest) => r.isSample === false && r.requester === DEMO_USER), error: null };
  } catch {
    return { requests: [], error: "이전 브라우저 데이터를 읽지 못했습니다. 원본은 삭제하지 않았습니다." };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const query = useGetPortal({ query: { enabled: !pending, refetchInterval: 5000, refetchOnWindowFocus: true, staleTime: 0, retry: 1 } });
  const [role, setRoleState] = useState<Role>(() => {
    try {
      const saved = localStorage.getItem(ROLE_KEY);
      return saved === "manager" || saved === "agent" ? saved : "requester";
    } catch { return "requester"; }
  });
  const [legacy] = useState(legacyData);
  const [imported, setImported] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(action: () => Promise<T>, isSnapshot = true): Promise<T | null> => {
    if (savingRef.current) return null;
    savingRef.current = true;
    setPending(true);
    setError(null);
    try {
      await queryClient.cancelQueries({ queryKey: getGetPortalQueryKey() });
      const result = await action();
      if (isSnapshot) queryClient.setQueryData(getGetPortalQueryKey(), result);
      else await queryClient.invalidateQueries({ queryKey: getGetPortalQueryKey() });
      return result;
    } catch (e) {
      const text = message(e);
      setError(text);
      toast({ title: "저장하지 못했습니다", description: text, variant: "destructive" });
      await queryClient.invalidateQueries({ queryKey: getGetPortalQueryKey() });
      return null;
    } finally {
      savingRef.current = false;
      setPending(false);
    }
  }, [queryClient, toast]);

  if (!query.data) return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div role={query.isError ? "alert" : "status"} className="max-w-md rounded-xl border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Help Service Portal</h1>
        <p className="mt-3 text-sm">{query.isError ? "백엔드 서버의 데이터를 불러오지 못했습니다. 로컬 샘플 데이터로 대체하지 않습니다." : "서버에서 요청 데이터를 불러오는 중입니다."}</p>
        {query.isError && <button onClick={() => void query.refetch()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground">다시 시도</button>}
      </div>
    </div>
  );
  const data: PortalSnapshot = query.data;
  const state: AppState = { ...data, version: 1, role, currentUser: DEMO_USER, seq: 0 };
  const batch = (ids: string[], action: "advance" | "assign", assignee?: string) => run(() => batchPortalRequests({
    ids, action, ...(assignee ? { assignee } : {}),
    expectedStages: Object.fromEntries(state.requests.filter((r) => ids.includes(r.id)).map((r) => [r.id, r.stage])),
  })).then(Boolean);

  const value: Store = {
    state,
    isSaving: pending,
    loadError: error ?? (query.isError ? "서버 연결이 끊겼습니다. 마지막으로 조회한 정보를 표시합니다." : null),
    dismissError: () => setError(null),
    setRole: (next) => {
      setRoleState(next);
      try { localStorage.setItem(ROLE_KEY, next); } catch { /* UI preference only; business data stays on server. */ }
    },
    createRequest: (input) => run(async () => {
      const created = await createPortalRequest(input);
      queryClient.setQueryData<PortalSnapshot>(getGetPortalQueryKey(), (current) => current ? {
        ...current, requests: [created, ...current.requests.filter((r) => r.id !== created.id)],
      } : current);
      return created;
    }, false),
    advance: (ids) => batch(ids, "advance"),
    assign: (ids, assignee) => batch(ids, "assign", assignee),
    rate: (id, rating, feedback) => run(() => ratePortalRequest(id, { rating, feedback })).then(Boolean),
    markRead: (id) => run(() => readPortalNotifications({ ids: [id] })).then(Boolean),
    markAllRead: () => run(() => readPortalNotifications({ ids: state.notifications.filter((n) => !n.read).map((n) => n.id) })).then(Boolean),
    saveCompanies: (companies) => run(() => savePortalCompanies({ companies })).then(Boolean),
    companyLabel: (id) => state.companies.find((c) => c.id === id)?.label ?? id,
    legacyCount: imported ? 0 : legacy.requests.length,
    legacyError: legacy.error,
    importLegacy: async () => {
      const result = await run(() => importPortalRequests({ requests: legacy.requests }));
      if (result) setImported(true);
      return !!result;
    },
  };
  return <Ctx.Provider value={value}>
    {pending && <div role="status" className="fixed bottom-4 right-4 z-[100] rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground shadow">서버에 저장 중…</div>}
    <fieldset disabled={pending} className="contents min-w-0">{children}</fieldset>
  </Ctx.Provider>;
}

export function useStore() {
  const value = useContext(Ctx);
  if (!value) throw new Error("StoreProvider missing");
  return value;
}
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildSeed } from "./seed";
import { serviceById } from "./catalog";
import { SLA_HOURS, STAGES, type AppState, type Priority, type Role, type ServiceRequest, type Stage } from "./types";

const KEY = "dg-help-portal-v1";

function load(): { state: AppState; error: string | null } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { state: buildSeed(), error: null };
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== 1 || !Array.isArray(parsed.requests)) throw new Error("bad");
    return { state: { ...parsed, role: parsed.role === "manager" || parsed.role === "agent" ? parsed.role : "requester" }, error: null };
  } catch {
    return { state: buildSeed(), error: "저장된 데모 데이터를 읽지 못해 샘플 데이터로 다시 시작했습니다." };
  }
}

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
  loadError: string | null;
  dismissError: () => void;
  setRole: (r: Role) => void;
  createRequest: (i: NewRequestInput) => ServiceRequest;
  advance: (ids: string[]) => void;
  assign: (ids: string[], agent: string) => void;
  rate: (id: string, rating: number, feedback: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  renameCompany: (id: string, label: string) => void;
  reset: () => void;
  companyLabel: (id: string) => string;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [{ state: initial, error }] = useState(load);
  const [state, setState] = useState<AppState>(initial);
  const [loadError, setLoadError] = useState<string | null>(error);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      setLoadError("브라우저 저장 공간에 기록하지 못했습니다. 변경 사항이 새로고침 후 사라질 수 있습니다.");
    }
  }, [state]);

  const notify = (s: AppState, title: string, body: string, requestId: string | null): AppState => ({
    ...s,
    notifications: [
      { id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), title, body, requestId, read: false },
      ...s.notifications,
    ],
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const createRequest = useCallback((i: NewRequestInput) => {
    const now = new Date();
    const cur = stateRef.current;
    const created: ServiceRequest = {
      id: `r-${now.getTime()}`,
      code: `SR-${cur.seq}`,
      ...i,
      stage: "접수",
      requester: cur.currentUser,
      assignee: null,
      createdAt: now.toISOString(),
      dueAt: new Date(now.getTime() + SLA_HOURS[i.priority] * 3600000).toISOString(),
      transitions: [{ stage: "접수", at: now.toISOString(), by: cur.currentUser }],
      rating: null,
      feedback: null,
      isSample: false,
    };
    setState((s) => {
      const next = { ...s, seq: s.seq + 1, requests: [created, ...s.requests] };
      return notify(next, `${created.code} 접수 완료`, `'${created.title}' 요청이 접수되었습니다. ${serviceById(i.serviceId)?.name ?? ""}`, created.id);
    });
    return created;
  }, []);

  const advance = useCallback((ids: string[]) => {
    setState((s) => {
      let next = s;
      const now = new Date().toISOString();
      const requests = s.requests.map((r) => {
        if (!ids.includes(r.id)) return r;
        const idx = STAGES.indexOf(r.stage);
        if (idx >= STAGES.indexOf("완료")) return r;
        const stage = STAGES[idx + 1] as Stage;
        return { ...r, stage, assignee: r.assignee ?? "박서준", transitions: [...r.transitions, { stage, at: now, by: r.assignee ?? "박서준" }] };
      });
      next = { ...s, requests };
      requests.forEach((r) => {
        if (ids.includes(r.id) && r.stage === "완료" && r.transitions[r.transitions.length - 1].at === now) {
          next = notify(next, `${r.code} 완료, 평가를 남겨 주세요`, `'${r.title}' 작업이 완료되었습니다.`, r.id);
        }
      });
      return next;
    });
  }, []);

  const assign = useCallback((ids: string[], agent: string) => {
    setState((s) => {
      let next: AppState = { ...s, requests: s.requests.map((r) => (ids.includes(r.id) ? { ...r, assignee: agent } : r)) };
      s.requests.filter((r) => ids.includes(r.id)).forEach((r) => {
        next = notify(next, `${r.code} 담당자 배정`, `${agent} 상담원이 '${r.title}' 요청을 담당합니다.`, r.id);
      });
      return next;
    });
  }, []);

  const rate = useCallback((id: string, rating: number, feedback: string) => {
    setState((s) => {
      const now = new Date().toISOString();
      const next: AppState = {
        ...s,
        requests: s.requests.map((r) =>
          r.id === id && r.stage === "완료"
            ? { ...r, stage: "평가", rating, feedback, transitions: [...r.transitions, { stage: "평가", at: now, by: s.currentUser }] }
            : r,
        ),
      };
      const r = s.requests.find((x) => x.id === id);
      return r ? notify(next, `${r.code} 평가 감사합니다`, `만족도 ${rating}점이 기록되었습니다.`, id) : next;
    });
  }, []);

  const value = useMemo<Store>(
    () => ({
      state,
      loadError,
      dismissError: () => setLoadError(null),
      setRole: (role) => setState((s) => ({ ...s, role })),
      createRequest,
      advance,
      assign,
      rate,
      markRead: (id) => setState((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () => setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      renameCompany: (id, label) => setState((s) => ({ ...s, companies: s.companies.map((c) => (c.id === id ? { ...c, label } : c)) })),
      reset: () => setState(buildSeed()),
      companyLabel: (id) => state.companies.find((c) => c.id === id)?.label ?? id,
    }),
    [state, loadError, createRequest, advance, assign, rate],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}

export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

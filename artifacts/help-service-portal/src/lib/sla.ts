import { STAGES, type ServiceRequest, type Stage } from "./types";

export type SlaStatus = "met" | "breached" | "risk" | "ok";
export const SLA_LABEL: Record<SlaStatus, string> = {
  met: "준수",
  breached: "위반",
  risk: "임박",
  ok: "정상",
};

export const stageIndex = (s: Stage) => STAGES.indexOf(s);
export const isDone = (r: ServiceRequest) => stageIndex(r.stage) >= stageIndex("완료");

export function completedAt(r: ServiceRequest): number | null {
  const t = r.transitions.find((x) => x.stage === "완료");
  return t ? new Date(t.at).getTime() : null;
}

export function slaStatus(r: ServiceRequest, now = Date.now()): SlaStatus {
  const due = new Date(r.dueAt).getTime();
  const created = new Date(r.createdAt).getTime();
  const done = completedAt(r);
  if (done !== null) return done <= due ? "met" : "breached";
  if (now > due) return "breached";
  if ((due - now) / (due - created) <= 0.25) return "risk";
  return "ok";
}

export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return rm ? `${h}시간 ${rm}분` : `${h}시간`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d}일 ${rh}시간` : `${d}일`;
}

export function remainingLabel(r: ServiceRequest, now = Date.now()): string {
  const due = new Date(r.dueAt).getTime();
  const done = completedAt(r);
  if (done !== null) return done <= due ? "기한 내 완료" : `${formatDuration(done - due)} 초과 완료`;
  return now > due ? `${formatDuration(now - due)} 초과` : `${formatDuration(due - now)} 남음`;
}

export function stageDurations(r: ServiceRequest, now = Date.now()) {
  return r.transitions.map((t, i) => {
    const start = new Date(t.at).getTime();
    const next = r.transitions[i + 1];
    const end = next ? new Date(next.at).getTime() : t.stage === "평가" ? start : now;
    return { ...t, ms: end - start, current: !next && t.stage !== "평가" };
  });
}

export function leadTime(r: ServiceRequest): number | null {
  const done = completedAt(r);
  return done === null ? null : done - new Date(r.createdAt).getTime();
}

export function fmtDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

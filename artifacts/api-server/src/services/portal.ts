import { createHash, randomUUID } from "node:crypto";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db, companies, requests, transitions, ratings, notifications } from "@workspace/db";
import { ImportPortalRequestsBody, type BatchInput, type CompanyInput, type RatingInput, type RequestInput } from "@workspace/api-zod";
import { snapshot, notify, companyExists } from "../repositories/portal";
import { AGENTS, DEMO_USER, ensure, SLA_HOURS, STAGES, validateRequest } from "../lib/portal-rules";

export async function initializePortal() {
  await db.transaction(async (tx) => {
    // DML only: schema creation is handled by drizzle-kit in development / Publish.
    await tx.execute(sql`select pg_advisory_xact_lock(9376041)`);
    const existing = await tx.select({ id: companies.id }).from(companies).limit(1);
    if (existing.length) return;
    await tx.insert(companies).values([
      { id: "c1", label: "디스커버리" }, { id: "c2", label: "계열사 A" },
      { id: "c3", label: "계열사 B" }, { id: "c4", label: "계열사 C" },
    ]);
    const examples: { id: string; title: string; serviceId: string; fields: Record<string, string>; priority: keyof typeof SLA_HOURS; companyId: string; hours: number; steps: readonly string[] }[] = [
      { id: "db-sample-1", title: "재택 VPN 접속 인증 실패", serviceId: "net-vpn", fields: { where: "재택 VPN", scope: "나만" }, priority: "긴급" as const, companyId: "c1", hours: 3, steps: ["접수", "검토"] as const },
      { id: "db-sample-2", title: "재무팀 공유폴더 권한 요청", serviceId: "acct-perm", fields: { target: "재무팀 공유폴더", level: "쓰기" }, priority: "높음" as const, companyId: "c2", hours: 10, steps: ["접수", "검토", "승인", "작업"] as const },
      { id: "db-sample-3", title: "신규 입사자 노트북 지급", serviceId: "hw-laptop", fields: { device: "노트북", reason: "신규 입사", location: "본사" }, priority: "낮음" as const, companyId: "c3", hours: 50, steps: STAGES.slice(0, 5) },
    ];
    for (const sample of examples) {
      const start = Date.now() - sample.hours * 3600000;
      await tx.insert(requests).values({
        id: sample.id, title: sample.title, description: "3계층 구조 확인용 샘플 요청입니다.",
        companyId: sample.companyId, serviceId: sample.serviceId, fields: sample.fields,
        priority: sample.priority, stage: sample.steps[sample.steps.length - 1],
        requester: DEMO_USER, assignee: AGENTS[0], createdAt: new Date(start).toISOString(),
        dueAt: new Date(start + SLA_HOURS[sample.priority] * 3600000).toISOString(), isSample: true,
      });
      await tx.insert(transitions).values(sample.steps.map((stage, i) => ({
        requestId: sample.id, stage, at: new Date(start + i * 1800000).toISOString(), by: i === 0 ? DEMO_USER : AGENTS[0],
      })));
      await notify(tx, "샘플 요청 안내", sample.title, sample.id);
    }
  });
}

export async function createRequest(input: RequestInput) {
  validateRequest(input);
  return db.transaction(async (tx) => {
    ensure(await companyExists(tx, input.companyId), "회사를 찾을 수 없습니다.", 404);
    const now = new Date();
    const id = randomUUID();
    await tx.insert(requests).values({
      ...input, title: input.title.trim(), id, stage: "접수", requester: DEMO_USER,
      createdAt: now.toISOString(), dueAt: new Date(now.getTime() + SLA_HOURS[input.priority] * 3600000).toISOString(),
    });
    await tx.insert(transitions).values({ requestId: id, stage: "접수", at: now.toISOString(), by: DEMO_USER });
    await notify(tx, "요청 접수 완료", input.title.trim(), id);
    return (await snapshot(tx)).requests.find((r) => r.id === id)!;
  });
}

export async function batchRequests(input: BatchInput) {
  ensure(new Set(input.ids).size === input.ids.length, "요청이 중복되었습니다.");
  if (input.action === "assign") ensure(input.assignee && AGENTS.includes(input.assignee), "담당자를 선택해 주세요.");
  return db.transaction(async (tx) => {
    // Stable row-lock order prevents both double-advancement and batch deadlocks.
    const rows = await tx.select().from(requests).where(inArray(requests.id, input.ids)).orderBy(asc(requests.id)).for("update");
    ensure(rows.length === input.ids.length, "일부 요청을 찾을 수 없습니다.", 404);
    for (const r of rows) {
      ensure(input.expectedStages[r.id] === r.stage, "다른 사용자가 요청을 변경했습니다. 최신 상태를 확인한 뒤 다시 시도해 주세요.", 409);
      if (input.action === "assign") {
        await tx.update(requests).set({ assignee: input.assignee }).where(eq(requests.id, r.id));
        await notify(tx, "담당자 배정", `${input.assignee} 상담원이 '${r.title}' 요청을 담당합니다.`, r.id);
      } else {
        const index = STAGES.indexOf(r.stage as (typeof STAGES)[number]);
        ensure(index >= 0 && index < 4, "완료된 요청은 상담원이 다음 단계로 변경할 수 없습니다.", 409);
        const stage = STAGES[index + 1];
        const actor = r.assignee ?? AGENTS[0];
        await tx.update(requests).set({ stage, assignee: actor }).where(eq(requests.id, r.id));
        await tx.insert(transitions).values({ requestId: r.id, stage, by: actor });
        await notify(tx, stage === "완료" ? "완료, 평가를 남겨 주세요" : `${stage} 단계로 진행`, r.title, r.id);
      }
    }
    return snapshot(tx);
  });
}

export async function rateRequest(id: string, input: RatingInput) {
  ensure(input.feedback.trim().length >= 2, "의견은 2자 이상 입력해 주세요.");
  return db.transaction(async (tx) => {
    const [r] = await tx.select().from(requests).where(eq(requests.id, id)).for("update");
    ensure(r, "요청을 찾을 수 없습니다.", 404);
    ensure(r.requester === DEMO_USER, "본인의 요청만 평가할 수 있습니다.", 403);
    ensure(r.stage === "완료", "완료 상태에서만 한 번 평가할 수 있습니다.", 409);
    await tx.insert(ratings).values({ requestId: id, rating: input.rating, feedback: input.feedback.trim() });
    await tx.update(requests).set({ stage: "평가" }).where(eq(requests.id, id));
    await tx.insert(transitions).values({ requestId: id, stage: "평가", by: DEMO_USER });
    await notify(tx, "평가 감사합니다", `${r.title}: 만족도 ${input.rating}점`, id);
    return snapshot(tx);
  });
}

export async function saveCompanies(input: CompanyInput) {
  ensure(new Set(input.companies.map((c) => c.id)).size === input.companies.length, "회사 ID가 중복되었습니다.");
  return db.transaction(async (tx) => {
    for (const c of [...input.companies].sort((a, b) => a.id.localeCompare(b.id))) {
      ensure(c.label.trim(), "회사 이름은 비워 둘 수 없습니다.");
      ensure(await companyExists(tx, c.id), "회사를 찾을 수 없습니다.", 404);
      await tx.update(companies).set({ label: c.label.trim() }).where(eq(companies.id, c.id));
    }
    return snapshot(tx);
  });
}

export async function readNotifications(ids: string[]) {
  return db.transaction(async (tx) => {
    if (ids.length) await tx.update(notifications).set({ read: true }).where(inArray(notifications.id, ids));
    return snapshot(tx);
  });
}

type LegacyRequests = ReturnType<typeof ImportPortalRequestsBody.parse>;
export async function importRequests(input: LegacyRequests) {
  return db.transaction(async (tx) => {
    for (const r of input.requests) {
      ensure(!r.isSample, "직접 생성한 요청만 가져올 수 있습니다.");
      validateRequest(r);
      ensure(await companyExists(tx, r.companyId), "이전 요청의 회사를 찾을 수 없습니다.");
      ensure(r.requester === DEMO_USER, "현재 데모 사용자가 생성한 요청만 가져올 수 있습니다.");
      ensure(r.assignee === null || AGENTS.includes(r.assignee), "올바르지 않은 담당자입니다.");
      const index = STAGES.indexOf(r.stage);
      ensure(r.transitions.length === index + 1, "요청 처리 이력이 올바르지 않습니다.");
      r.transitions.forEach((t, i) => {
        ensure(t.stage === STAGES[i] && t.at.getTime() >= (i === 0 ? r.createdAt : r.transitions[i - 1].at).getTime(), "단계 순서 또는 시각이 올바르지 않습니다.");
        ensure(t.at.getTime() <= Date.now() + 60000, "미래의 처리 이력은 가져올 수 없습니다.");
      });
      ensure(r.transitions[0].at.getTime() === r.createdAt.getTime(), "접수 시각이 일치하지 않습니다.");
      ensure(r.dueAt.getTime() > r.createdAt.getTime(), "처리 기한이 올바르지 않습니다.");
      ensure(r.stage === "평가" ? r.rating !== null && (r.feedback?.trim().length ?? 0) >= 2 : r.rating === null && r.feedback === null, "평가 기록이 올바르지 않습니다.");
      const importKey = createHash("sha256").update(`${r.id}|${r.createdAt.toISOString()}|${r.requester}`).digest("hex");
      const id = randomUUID();
      const [inserted] = await tx.insert(requests).values({
        id, importKey, title: r.title, description: r.description, companyId: r.companyId, serviceId: r.serviceId,
        fields: r.fields, priority: r.priority, stage: r.stage, requester: r.requester, assignee: r.assignee,
        createdAt: r.createdAt.toISOString(), dueAt: r.dueAt.toISOString(),
      }).onConflictDoNothing({ target: requests.importKey }).returning({ id: requests.id });
      if (!inserted) continue;
      await tx.insert(transitions).values(r.transitions.map((t) => ({ requestId: id, stage: t.stage, at: t.at.toISOString(), by: t.by })));
      if (r.rating !== null) await tx.insert(ratings).values({ requestId: id, rating: r.rating, feedback: r.feedback! });
      await notify(tx, "이전 브라우저 요청 가져오기", r.title, id);
    }
    return snapshot(tx);
  });
}

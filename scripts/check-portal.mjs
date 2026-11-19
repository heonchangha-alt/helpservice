// Integration regression checks. Creates two clearly labeled records; never resets shared data.
// Run while the managed API workflow is running: node scripts/check-portal.mjs
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const base = process.env.PORTAL_TEST_URL ?? "http://localhost:80";
const prefix = `API 회귀 검증 ${randomUUID().slice(0, 8)}`;
async function call(path, body, expected = 200, method = "POST") {
  const response = await fetch(`${base}/api/portal${path}`, {
    method, headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = await response.json();
  assert.equal(response.status, expected, JSON.stringify(json));
  return json;
}
const snapshot = () => call("", undefined, 200, "GET");
const input = { title: prefix, description: "자동 API 회귀 검증용 요청", companyId: "c1", serviceId: "net-vpn", fields: { where: "재택 VPN", scope: "나만" }, priority: "보통" };
await call("/requests", { ...input, title: "짧음" }, 400);
await call("/requests", { ...input, fields: {} }, 400);
await call("/requests", { ...input, companyId: "unknown" }, 404);
await call("/requests", { ...input, serviceId: "not-a-service" }, 400);
const created = await call("/requests", { ...input, requester: "위조 사용자", stage: "평가" }, 201);
assert.equal(created.stage, "접수");
assert.equal(created.requester, "김하늘");
assert.ok(created.code.startsWith("SR-"));
const first = (await snapshot()).requests.find((r) => r.id === created.id);
assert.deepEqual(first, created);

await call(`/requests/${created.id}/rating`, { rating: 4, feedback: "완료 전 평가" }, 409);
const advance = { ids: [created.id], action: "advance", expectedStages: { [created.id]: "접수" } };
const parallel = await Promise.all([1, 2].map(async () => {
  const r = await fetch(`${base}/api/portal/batch`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(advance) });
  return r.status;
}));
assert.deepEqual(parallel.sort(), [200, 409]);
let current = (await snapshot()).requests.find((r) => r.id === created.id);
assert.equal(current.stage, "검토");
assert.equal(current.transitions.length, 2);
await call("/batch", { ids: [created.id, "missing-request"], action: "advance", expectedStages: { [created.id]: "검토", "missing-request": "접수" } }, 404);
assert.equal((await snapshot()).requests.find((r) => r.id === created.id).stage, "검토");
await call("/batch", { ids: [created.id], action: "assign", assignee: "이도윤", expectedStages: { [created.id]: "검토" } });
for (const stage of ["검토", "승인", "작업"]) {
  await call("/batch", { ids: [created.id], action: "advance", expectedStages: { [created.id]: stage } });
}
await call("/batch", { ids: [created.id], action: "advance", expectedStages: { [created.id]: "완료" } }, 409);
await call(`/requests/${created.id}/rating`, { rating: 0, feedback: "점수 오류" }, 400);
await call(`/requests/${created.id}/rating`, { rating: 4, feedback: "DB 저장과 트랜잭션 검증" });
await call(`/requests/${created.id}/rating`, { rating: 5, feedback: "중복 평가 차단" }, 409);
current = (await snapshot()).requests.find((r) => r.id === created.id);
assert.equal(current.stage, "평가");
assert.equal(current.rating, 4);
assert.equal(current.assignee, "이도윤");
assert.equal(current.transitions.length, 6);

const legacy = { ...current, id: `legacy-${randomUUID()}`, code: "SR-OLD", title: `${prefix} 이전 요청` };
const imported = await call("/import", { requests: [legacy] });
const importedRow = imported.requests.find((r) => r.title === legacy.title);
assert.ok(importedRow);
assert.notEqual(importedRow.id, legacy.id);
assert.equal(importedRow.rating, 4);
assert.deepEqual(importedRow.transitions, legacy.transitions);
const repeated = await call("/import", { requests: [legacy] });
assert.equal(repeated.requests.filter((r) => r.title === legacy.title).length, 1);
await call("/companies", { companies: [{ id: "c1", label: "   " }] }, 400, "PATCH");
const noticeIds = repeated.notifications.filter((n) => [created.id, importedRow.id].includes(n.requestId)).map((n) => n.id);
const read = await call("/notifications/read", { ids: noticeIds });
assert.ok(read.notifications.filter((n) => noticeIds.includes(n.id)).every((n) => n.read));
console.log(JSON.stringify({ result: "PASS", cases: "validation, server identity, persisted creation, concurrent conflict, atomic batch, assignment, stages, rating, import deduplication, notifications", testRequestIds: [created.id, importedRow.id] }, null, 2));

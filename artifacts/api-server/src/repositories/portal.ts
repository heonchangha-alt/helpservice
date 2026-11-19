import { randomUUID } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { db, companies, requests, transitions, ratings, notifications } from "@workspace/db";
import { GetPortalResponse } from "@workspace/api-zod";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function snapshot(tx: Transaction) {
  const companyRows = await tx.select().from(companies).orderBy(asc(companies.id));
  const requestRows = await tx.select().from(requests).orderBy(desc(requests.createdAt), desc(requests.number));
  const history = await tx.select().from(transitions).orderBy(asc(transitions.id));
  const scores = await tx.select().from(ratings);
  const notices = await tx.select().from(notifications).orderBy(desc(notifications.at));
  return GetPortalResponse.parse({
    companies: companyRows,
    requests: requestRows.map((r) => {
      const score = scores.find((s) => s.requestId === r.id);
      return {
        ...r,
        code: `SR-${1000 + r.number}`,
        transitions: history.filter((t) => t.requestId === r.id).map(({ stage, at, by }) => ({ stage, at, by })),
        rating: score?.rating ?? null,
        feedback: score?.feedback ?? null,
      };
    }),
    notifications: notices,
  });
}

export const getSnapshot = () => db.transaction(snapshot, { isolationLevel: "repeatable read", accessMode: "read only" });

export async function notify(tx: Transaction, title: string, body: string, requestId: string) {
  await tx.insert(notifications).values({ id: randomUUID(), title, body, requestId });
}

export async function companyExists(tx: Transaction, id: string) {
  return (await tx.select({ id: companies.id }).from(companies).where(eq(companies.id, id))).length > 0;
}

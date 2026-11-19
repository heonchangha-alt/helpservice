import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { companies } from "./companies";

export const requests = pgTable("portal_requests", {
  id: text("id").primaryKey(),
  number: serial("number").unique().notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  companyId: text("company_id").notNull().references(() => companies.id),
  serviceId: text("service_id").notNull(),
  fields: jsonb("fields").$type<Record<string, string>>().notNull(),
  priority: text("priority").notNull(),
  stage: text("stage").notNull(),
  requester: text("requester").notNull(),
  assignee: text("assignee"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  dueAt: timestamp("due_at", { withTimezone: true, mode: "string" }).notNull(),
  isSample: boolean("is_sample").notNull().default(false),
  importKey: text("import_key").unique(),
});
export const transitions = pgTable("portal_transitions", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => requests.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(),
  at: timestamp("at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  by: text("actor").notNull(),
});
export const ratings = pgTable("portal_ratings", {
  requestId: text("request_id").primaryKey().references(() => requests.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  feedback: text("feedback").notNull(),
});
export const insertRequestSchema = createInsertSchema(requests).omit({ number: true });
export type RequestRow = typeof requests.$inferSelect;

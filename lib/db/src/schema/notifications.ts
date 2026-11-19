import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { requests } from "./requests";

export const notifications = pgTable("portal_notifications", {
  id: text("id").primaryKey(),
  at: timestamp("at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  requestId: text("request_id").references(() => requests.id, { onDelete: "cascade" }),
  read: boolean("read").notNull().default(false),
});
export const insertNotificationSchema = createInsertSchema(notifications);

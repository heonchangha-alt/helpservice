import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const companies = pgTable("portal_companies", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
});
export const insertCompanySchema = createInsertSchema(companies);
export type CompanyRow = typeof companies.$inferSelect;

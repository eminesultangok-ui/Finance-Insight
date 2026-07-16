import { pgTable, text, boolean, integer, uuid } from "drizzle-orm/pg-core";

export const dashboardSettingsTable = pgTable("dashboard_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  refreshInterval: integer("refresh_interval").notNull().default(300), // seconds
  defaultCategory: text("default_category").notNull().default("all"),
  theme: text("theme").notNull().default("matrix"),
  enableAiSummaries: boolean("enable_ai_summaries").notNull().default(true),
  aiSummarySchedule: text("ai_summary_schedule"),
});

export type DashboardSettings = typeof dashboardSettingsTable.$inferSelect;

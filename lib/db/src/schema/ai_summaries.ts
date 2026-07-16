import { pgTable, text, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";

export const aiSummariesTable = pgTable("ai_summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(), // morning | closing | alerts
  content: text("content").notNull(),
  highlights: jsonb("highlights").$type<string[]>().default([]),
  sentiment: text("sentiment").notNull().default("neutral"), // bullish | bearish | neutral
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export type AiSummary = typeof aiSummariesTable.$inferSelect;

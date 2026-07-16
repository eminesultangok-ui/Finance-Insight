import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const economicEventsTable = pgTable("economic_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  eventDate: timestamp("event_date").notNull(),
  importance: text("importance").notNull().default("medium"), // high | medium | low
  actual: text("actual"),
  forecast: text("forecast"),
  previous: text("previous"),
  description: text("description"),
  category: text("category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEconomicEventSchema = createInsertSchema(economicEventsTable).omit({ id: true, createdAt: true });
export type InsertEconomicEvent = z.infer<typeof insertEconomicEventSchema>;
export type EconomicEvent = typeof economicEventsTable.$inferSelect;

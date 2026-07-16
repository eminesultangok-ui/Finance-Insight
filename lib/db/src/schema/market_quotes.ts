import { pgTable, text, numeric, integer, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";

export const marketQuotesTable = pgTable("market_quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 20, scale: 6 }).notNull(),
  change: numeric("change", { precision: 20, scale: 6 }).notNull(),
  changePercent: numeric("change_percent", { precision: 10, scale: 4 }).notNull(),
  volume: numeric("volume", { precision: 20, scale: 2 }),
  high24h: numeric("high_24h", { precision: 20, scale: 6 }),
  low24h: numeric("low_24h", { precision: 20, scale: 6 }),
  marketCap: numeric("market_cap", { precision: 30, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  category: text("category").notNull(),
  marketStatus: text("market_status").notNull().default("closed"),
  sparkline: jsonb("sparkline").$type<number[]>().default([]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type MarketQuote = typeof marketQuotesTable.$inferSelect;

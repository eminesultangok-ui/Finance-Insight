import { pgTable, text, numeric, timestamp, uuid, index } from "drizzle-orm/pg-core";

export const priceHistoryTable = pgTable("price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  symbol: text("symbol").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  open: numeric("open", { precision: 20, scale: 6 }),
  high: numeric("high", { precision: 20, scale: 6 }),
  low: numeric("low", { precision: 20, scale: 6 }),
  close: numeric("close", { precision: 20, scale: 6 }).notNull(),
  volume: numeric("volume", { precision: 20, scale: 2 }),
}, (table) => [
  index("price_history_symbol_ts_idx").on(table.symbol, table.timestamp),
]);

export type PriceHistory = typeof priceHistoryTable.$inferSelect;

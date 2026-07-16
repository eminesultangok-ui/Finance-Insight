import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trackedAssetsTable = pgTable("tracked_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // indices | stocks | bist | etf | commodities | crypto | currencies
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTrackedAssetSchema = createInsertSchema(trackedAssetsTable).omit({ id: true, createdAt: true });
export type InsertTrackedAsset = z.infer<typeof insertTrackedAssetSchema>;
export type TrackedAsset = typeof trackedAssetsTable.$inferSelect;

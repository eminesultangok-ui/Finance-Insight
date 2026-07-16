import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsArticlesTable = pgTable("news_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  summary: text("summary"),
  url: text("url").notNull().unique(),
  imageUrl: text("image_url"),
  category: text("category").notNull().default("stock_market"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNewsArticleSchema = createInsertSchema(newsArticlesTable).omit({ id: true, createdAt: true });
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type NewsArticle = typeof newsArticlesTable.$inferSelect;

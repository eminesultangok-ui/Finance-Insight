import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { newsArticlesTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { GetNewsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/news", async (req, res): Promise<void> => {
  const parsed = GetNewsQueryParams.safeParse(req.query);
  const category = parsed.success ? parsed.data.category : undefined;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  const baseQuery = db.select().from(newsArticlesTable);
  const filteredQuery =
    !category || category === "all"
      ? baseQuery
      : (baseQuery as any).where(eq(newsArticlesTable.category, category));

  const [articles, countResult] = await Promise.all([
    (filteredQuery as any)
      .orderBy(desc(newsArticlesTable.publishedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(newsArticlesTable)
      .then((r) => r[0]?.count ?? 0),
  ]);

  res.json({
    articles: articles.map((a: typeof newsArticlesTable.$inferSelect) => ({
      id: a.id,
      title: a.title,
      source: a.source,
      publishedAt: a.publishedAt.toISOString(),
      summary: a.summary ?? null,
      url: a.url,
      imageUrl: a.imageUrl ?? null,
      category: a.category,
    })),
    total: Number(countResult),
  });
});

export default router;

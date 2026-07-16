import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { newsArticlesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { GetCompanyDetailParams } from "@workspace/api-zod";
import { fetchCompanyInfo } from "../lib/market-data";

const router: IRouter = Router();

router.get("/companies/:symbol", async (req, res): Promise<void> => {
  const rawSymbol = Array.isArray(req.params.symbol) ? req.params.symbol[0] : req.params.symbol;
  const params = GetCompanyDetailParams.safeParse({ symbol: rawSymbol });
  if (!params.success) {
    res.status(400).json({ error: "Invalid symbol" });
    return;
  }

  try {
    const [company, recentNews] = await Promise.all([
      fetchCompanyInfo(params.data.symbol),
      db
        .select()
        .from(newsArticlesTable)
        .orderBy(desc(newsArticlesTable.publishedAt))
        .limit(5),
    ]);

    res.json({
      ...company,
      news: recentNews.map((n) => ({
        id: n.id,
        title: n.title,
        source: n.source,
        publishedAt: n.publishedAt.toISOString(),
        summary: n.summary ?? null,
        url: n.url,
        imageUrl: n.imageUrl ?? null,
        category: n.category,
      })),
    });
  } catch {
    res.status(404).json({ error: "Company not found or data unavailable" });
  }
});

export default router;

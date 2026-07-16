import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { aiSummariesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { GetAiMarketSummaryQueryParams } from "@workspace/api-zod";
import { generateAndStoreAiSummary } from "../lib/ai-summary";

const router: IRouter = Router();

router.get("/ai/summary", async (req, res): Promise<void> => {
  const parsed = GetAiMarketSummaryQueryParams.safeParse(req.query);
  const type = (parsed.success ? parsed.data.type : "morning") as "morning" | "closing" | "alerts" ?? "morning";

  // Look for a recent summary (within last 6 hours)
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  const [existing] = await db
    .select()
    .from(aiSummariesTable)
    .where(eq(aiSummariesTable.type, type))
    .orderBy(desc(aiSummariesTable.generatedAt))
    .limit(1);

  if (existing && existing.generatedAt > sixHoursAgo) {
    res.json({
      type: existing.type,
      content: existing.content,
      highlights: (existing.highlights as string[]) ?? [],
      sentiment: existing.sentiment,
      generatedAt: existing.generatedAt.toISOString(),
    });
    return;
  }

  // Generate a fresh summary
  await generateAndStoreAiSummary(type);

  const [fresh] = await db
    .select()
    .from(aiSummariesTable)
    .where(eq(aiSummariesTable.type, type))
    .orderBy(desc(aiSummariesTable.generatedAt))
    .limit(1);

  if (!fresh) {
    res.status(503).json({ error: "Summary generation failed" });
    return;
  }

  res.json({
    type: fresh.type,
    content: fresh.content,
    highlights: (fresh.highlights as string[]) ?? [],
    sentiment: fresh.sentiment,
    generatedAt: fresh.generatedAt.toISOString(),
  });
});

export default router;

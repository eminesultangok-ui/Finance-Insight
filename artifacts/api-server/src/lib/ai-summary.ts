import { db } from "@workspace/db";
import { marketQuotesTable, newsArticlesTable, aiSummariesTable } from "@workspace/db";
import { desc, gte } from "drizzle-orm";
import { logger } from "./logger";

function buildMarketContext(quotes: typeof marketQuotesTable.$inferSelect[]): string {
  const indices = quotes.filter((q) => q.category === "indices").slice(0, 5);
  const topGainers = [...quotes]
    .sort((a, b) => Number(b.changePercent) - Number(a.changePercent))
    .slice(0, 3);
  const topLosers = [...quotes]
    .sort((a, b) => Number(a.changePercent) - Number(b.changePercent))
    .slice(0, 3);

  const indexLines = indices.map(
    (q) =>
      `${q.name}: ${Number(q.price).toFixed(2)} (${Number(q.changePercent) >= 0 ? "+" : ""}${Number(q.changePercent).toFixed(2)}%)`
  );

  return [
    "Major Indices:",
    ...indexLines,
    "",
    "Top Gainers: " + topGainers.map((q) => `${q.symbol} +${Number(q.changePercent).toFixed(2)}%`).join(", "),
    "Top Losers: " + topLosers.map((q) => `${q.symbol} ${Number(q.changePercent).toFixed(2)}%`).join(", "),
  ].join("\n");
}

function buildNewsContext(headlines: typeof newsArticlesTable.$inferSelect[]): string {
  return headlines
    .slice(0, 8)
    .map((n) => `- ${n.title} (${n.source})`)
    .join("\n");
}

export async function generateAiSummary(type: "morning" | "closing" | "alerts"): Promise<{
  content: string;
  highlights: string[];
  sentiment: "bullish" | "bearish" | "neutral";
}> {
  // Gather context from DB
  const [quotes, recentNews] = await Promise.all([
    db.select().from(marketQuotesTable).limit(50),
    db
      .select()
      .from(newsArticlesTable)
      .orderBy(desc(newsArticlesTable.publishedAt))
      .where(gte(newsArticlesTable.publishedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
      .limit(10),
  ]);

  const marketCtx = buildMarketContext(quotes);
  const newsCtx = buildNewsContext(recentNews);

  // Try to use OpenAI via environment variable (Replit AI integration)
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are FinMatrix AI, an institutional-grade market analyst. Write concise, professional market briefings. Be direct and data-driven. No fluff.",
            },
            {
              role: "user",
              content: `Generate a ${type} market briefing based on this data:\n\n${marketCtx}\n\nRecent News:\n${newsCtx}\n\nProvide: 1) A 2-3 paragraph analysis, 2) 3-5 bullet point highlights, 3) Overall market sentiment (bullish/bearish/neutral). Format as JSON: {"content": "...", "highlights": ["...", "..."], "sentiment": "bullish|bearish|neutral"}`,
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 600,
        }),
      });
      
      if (response.ok) {
        const data = (await response.json()) as any;
        const parsed = JSON.parse(data.choices[0].message.content);
        return {
          content: parsed.content ?? "Market analysis unavailable.",
          highlights: parsed.highlights ?? [],
          sentiment: parsed.sentiment ?? "neutral",
        };
      }
    }
  } catch (err) {
    logger.debug({ err }, "OpenAI API call failed, using rule-based summary");
  }

  // Rule-based fallback when no AI key is available
  return generateRuleBasedSummary(type, quotes, recentNews);
}

function generateRuleBasedSummary(
  type: string,
  quotes: typeof marketQuotesTable.$inferSelect[],
  news: typeof newsArticlesTable.$inferSelect[]
): { content: string; highlights: string[]; sentiment: "bullish" | "bearish" | "neutral" } {
  const indices = quotes.filter((q) => q.category === "indices");
  const avgChange = indices.length
    ? indices.reduce((sum, q) => sum + Number(q.changePercent), 0) / indices.length
    : 0;

  const sentiment: "bullish" | "bearish" | "neutral" =
    avgChange > 0.5 ? "bullish" : avgChange < -0.5 ? "bearish" : "neutral";

  const gainers = [...quotes]
    .sort((a, b) => Number(b.changePercent) - Number(a.changePercent))
    .slice(0, 3);
  const losers = [...quotes]
    .sort((a, b) => Number(a.changePercent) - Number(b.changePercent))
    .slice(0, 3);

  const bist = quotes.find((q) => q.symbol === "^BIST100");
  const sp500 = quotes.find((q) => q.symbol === "^GSPC");

  const bistLine = bist
    ? `BIST 100 trading at ${Number(bist.price).toLocaleString()} with a ${Number(bist.changePercent) >= 0 ? "gain" : "loss"} of ${Math.abs(Number(bist.changePercent)).toFixed(2)}%.`
    : "";
  const spLine = sp500
    ? `S&P 500 at ${Number(sp500.price).toLocaleString()}, ${Number(sp500.changePercent) >= 0 ? "up" : "down"} ${Math.abs(Number(sp500.changePercent)).toFixed(2)}%.`
    : "";

  const content =
    type === "morning"
      ? `Markets are opening with a ${sentiment} tone. ${bistLine} ${spLine} Global equity markets are showing ${avgChange >= 0 ? "positive" : "negative"} momentum with an average index change of ${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%.`
      : `Markets are closing ${avgChange >= 0 ? "higher" : "lower"}. ${bistLine} ${spLine} Today's session saw ${gainers[0]?.symbol ?? "N/A"} lead gains while ${losers[0]?.symbol ?? "N/A"} underperformed.`;

  const highlights = [
    `Top gainer: ${gainers[0]?.name ?? "N/A"} +${Math.abs(Number(gainers[0]?.changePercent ?? 0)).toFixed(2)}%`,
    `Top loser: ${losers[0]?.name ?? "N/A"} ${Number(losers[0]?.changePercent ?? 0).toFixed(2)}%`,
    bist ? `BIST 100: ${Number(bist.changePercent) >= 0 ? "+" : ""}${Number(bist.changePercent).toFixed(2)}%` : "BIST 100: No data",
    `Market sentiment: ${sentiment.toUpperCase()}`,
    news[0] ? `Latest: ${news[0].title.slice(0, 80)}` : "No recent news",
  ].filter(Boolean);

  return { content, highlights, sentiment };
}

export async function generateAndStoreAiSummary(type: "morning" | "closing" | "alerts"): Promise<void> {
  try {
    const summary = await generateAiSummary(type);
    await db.insert(aiSummariesTable).values({
      type,
      content: summary.content,
      highlights: summary.highlights,
      sentiment: summary.sentiment,
    });
    logger.info({ type }, "AI summary generated and stored");
  } catch (err) {
    logger.error({ err, type }, "Failed to generate AI summary");
  }
}

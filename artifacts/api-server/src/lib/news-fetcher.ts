import Parser from "rss-parser";
import { db } from "@workspace/db";
import { newsArticlesTable, newsSourcesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "FinMatrix/1.0" },
});

const DEFAULT_RSS_FEEDS = [
  { name: "Reuters Business", url: "https://feeds.reuters.com/reuters/businessNews", category: "global_markets" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", category: "stock_market" },
  { name: "CNBC Markets", url: "https://www.cnbc.com/id/20910258/device/rss/rss.html", category: "global_markets" },
  { name: "FT Markets", url: "https://www.ft.com/markets?format=rss", category: "global_markets" },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "crypto" },
  { name: "Seeking Alpha Commodities", url: "https://seekingalpha.com/tag/commodities.xml", category: "commodities" },
];

function guessCategoryFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("bitcoin") || t.includes("crypto") || t.includes("ethereum") || t.includes("defi")) return "crypto";
  if (t.includes("oil") || t.includes("gold") || t.includes("silver") || t.includes("commodity")) return "commodities";
  if (t.includes("fed") || t.includes("federal reserve") || t.includes("powell") || t.includes("ecb")) return "central_banks";
  if (t.includes("inflation") || t.includes("cpi") || t.includes("pce")) return "inflation";
  if (t.includes("interest rate") || t.includes("rate cut") || t.includes("rate hike")) return "interest_rates";
  if (t.includes("gdp") || t.includes("employment") || t.includes("jobs") || t.includes("unemployment")) return "global_markets";
  return "stock_market";
}

export async function fetchAndStoreNews(): Promise<void> {
  let sources: Array<{ url: string; name: string; category?: string | null }> = [];
  
  try {
    const dbSources = await db.select().from(newsSourcesTable)
      .where(eq(newsSourcesTable.isActive, true));
    sources = dbSources.length > 0 ? dbSources : DEFAULT_RSS_FEEDS;
  } catch {
    sources = DEFAULT_RSS_FEEDS;
  }

  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source.url);
      const articles = (feed.items ?? []).slice(0, 20);

      for (const item of articles) {
        if (!item.title || !item.link) continue;
        
        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        const category = source.category ?? guessCategoryFromTitle(item.title);

        try {
          await db.insert(newsArticlesTable).values({
            title: item.title,
            source: source.name,
            publishedAt: pubDate,
            summary: item.contentSnippet?.slice(0, 500) ?? item.summary?.slice(0, 500) ?? null,
            url: item.link,
            imageUrl: (item as any).enclosure?.url ?? null,
            category,
          }).onConflictDoNothing();
        } catch {
          // duplicate or constraint error — skip
        }
      }
    } catch (err) {
      logger.debug({ source: source.url, err }, "Failed to fetch RSS feed");
    }
  }
}

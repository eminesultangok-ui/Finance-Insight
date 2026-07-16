import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { marketQuotesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetMarketQuotesQueryParams,
  GetMarketQuoteBySymbolParams,
  GetMarketHistoryQueryParams,
} from "@workspace/api-zod";
import { fetchHistory, fetchCompanyInfo } from "../lib/market-data";

const router: IRouter = Router();

router.get("/market/quotes", async (req, res): Promise<void> => {
  const parsed = GetMarketQuotesQueryParams.safeParse(req.query);
  const category = parsed.success ? parsed.data.category : undefined;

  const rows = await db.select().from(marketQuotesTable);
  const filtered =
    !category || category === "all"
      ? rows
      : rows.filter((r) => r.category === category);

  const quotes = filtered.map((r) => ({
    symbol: r.symbol,
    name: r.name,
    price: Number(r.price),
    change: Number(r.change),
    changePercent: Number(r.changePercent),
    volume: Number(r.volume ?? 0),
    high24h: r.high24h !== null ? Number(r.high24h) : null,
    low24h: r.low24h !== null ? Number(r.low24h) : null,
    marketCap: r.marketCap !== null ? Number(r.marketCap) : null,
    currency: r.currency,
    category: r.category,
    marketStatus: r.marketStatus,
    sparkline: (r.sparkline as number[]) ?? [],
    updatedAt: r.updatedAt.toISOString(),
  }));

  res.json(quotes);
});

router.get("/market/indices", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(marketQuotesTable)
    .where(eq(marketQuotesTable.category, "indices"));

  const quotes = rows.map((r) => ({
    symbol: r.symbol,
    name: r.name,
    price: Number(r.price),
    change: Number(r.change),
    changePercent: Number(r.changePercent),
    volume: Number(r.volume ?? 0),
    high24h: r.high24h !== null ? Number(r.high24h) : null,
    low24h: r.low24h !== null ? Number(r.low24h) : null,
    marketCap: r.marketCap !== null ? Number(r.marketCap) : null,
    currency: r.currency,
    category: r.category,
    marketStatus: r.marketStatus,
    sparkline: (r.sparkline as number[]) ?? [],
    updatedAt: r.updatedAt.toISOString(),
  }));

  res.json(quotes);
});

router.get("/market/quotes/:symbol", async (req, res): Promise<void> => {
  const rawSymbol = Array.isArray(req.params.symbol) ? req.params.symbol[0] : req.params.symbol;
  const params = GetMarketQuoteBySymbolParams.safeParse({ symbol: rawSymbol });
  if (!params.success) {
    res.status(400).json({ error: "Invalid symbol" });
    return;
  }

  const [row] = await db
    .select()
    .from(marketQuotesTable)
    .where(eq(marketQuotesTable.symbol, params.data.symbol));

  if (!row) {
    res.status(404).json({ error: "Symbol not found" });
    return;
  }

  res.json({
    symbol: row.symbol,
    name: row.name,
    price: Number(row.price),
    change: Number(row.change),
    changePercent: Number(row.changePercent),
    volume: Number(row.volume ?? 0),
    high24h: row.high24h !== null ? Number(row.high24h) : null,
    low24h: row.low24h !== null ? Number(row.low24h) : null,
    marketCap: row.marketCap !== null ? Number(row.marketCap) : null,
    currency: row.currency,
    category: row.category,
    marketStatus: row.marketStatus,
    sparkline: (row.sparkline as number[]) ?? [],
    dayOpen: null,
    previousClose: null,
    fiftyTwoWeekHigh: null,
    fiftyTwoWeekLow: null,
    avgVolume: null,
    updatedAt: row.updatedAt.toISOString(),
  });
});

router.get("/market/history", async (req, res): Promise<void> => {
  const parsed = GetMarketHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing required query param: symbol" });
    return;
  }

  const { symbol, period, interval } = parsed.data;
  try {
    const history = await fetchHistory(symbol, period ?? "1mo", interval ?? "1d");
    const bars = history.map((h) => ({
      timestamp: h.timestamp.toISOString(),
      open: h.open,
      high: h.high,
      low: h.low,
      close: h.close,
      volume: h.volume,
    }));
    res.json(bars);
  } catch (err) {
    req.log.warn({ symbol, err }, "Failed to fetch history");
    res.status(502).json({ error: "Failed to fetch historical data" });
  }
});

export default router;

// yahoo-finance2 v4 requires instantiation
import YahooFinanceLib from "yahoo-finance2";
// v4: default export is the class, must call new
const yahooFinance = new (YahooFinanceLib as any)();

import { db } from "@workspace/db";
import {
  marketQuotesTable,
  trackedAssetsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export const DEFAULT_SYMBOLS: Record<string, string[]> = {
  indices: ["^BIST100", "^GSPC", "^NDX", "^DJI", "^FTSE", "^N225", "^HSI"],
  bist: ["THYAO.IS", "GARAN.IS", "AKBNK.IS", "SISE.IS", "EREGL.IS", "KCHOL.IS", "BIMAS.IS", "TCELL.IS", "ASELS.IS", "FROTO.IS"],
  stocks: ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRKB", "JPM", "V"],
  etf: ["SPY", "QQQ", "IWM", "GLD", "SLV", "USO", "VTI", "EEM", "XLE", "XLF"],
  commodities: ["GC=F", "SI=F", "CL=F", "NG=F", "HG=F", "ZW=F"],
  crypto: ["BTC-USD", "ETH-USD", "BNB-USD", "XRP-USD", "SOL-USD", "ADA-USD"],
  currencies: ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDTRY=X", "USDCHF=X", "AUDUSD=X"],
};

function categoryForSymbol(symbol: string): string {
  for (const [cat, syms] of Object.entries(DEFAULT_SYMBOLS)) {
    if (syms.includes(symbol)) return cat;
  }
  if (symbol.endsWith(".IS")) return "bist";
  if (symbol.startsWith("^")) return "indices";
  if (symbol.endsWith("-USD") && symbol.length <= 10) return "crypto";
  if (symbol.endsWith("=X")) return "currencies";
  if (symbol.endsWith("=F")) return "commodities";
  return "stocks";
}

function marketStatusFromTime(): "open" | "closed" | "pre" | "after" {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return "closed";
  // NYSE: 14:30 - 21:00 UTC (EST+5)
  if (utcHour >= 14 && utcHour < 21) return "open";
  if (utcHour >= 10 && utcHour < 14) return "pre";
  if (utcHour >= 21 && utcHour < 24) return "after";
  return "closed";
}

export async function fetchAndStoreQuotes(symbols: string[]): Promise<void> {
  const chunks = [];
  for (let i = 0; i < symbols.length; i += 10) {
    chunks.push(symbols.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    try {
      const results = await yahooFinance.quote(chunk);
      const quotes = Array.isArray(results) ? results : [results];

      for (const q of quotes) {
        if (!q || !q.symbol) continue;
        try {
          const price = q.regularMarketPrice ?? 0;
          const change = q.regularMarketChange ?? 0;
          const changePercent = q.regularMarketChangePercent ?? 0;
          const volume = q.regularMarketVolume ?? 0;
          const high = q.regularMarketDayHigh ?? null;
          const low = q.regularMarketDayLow ?? null;
          const marketCap = q.marketCap ?? null;
          const currency = q.currency ?? "USD";
          const category = categoryForSymbol(q.symbol);
          const status = marketStatusFromTime();

          await db.insert(marketQuotesTable).values({
            symbol: q.symbol,
            name: q.longName ?? q.shortName ?? q.symbol,
            price: String(price),
            change: String(change),
            changePercent: String(changePercent),
            volume: String(volume),
            high24h: high !== null ? String(high) : null,
            low24h: low !== null ? String(low) : null,
            marketCap: marketCap !== null ? String(marketCap) : null,
            currency,
            category,
            marketStatus: status,
            sparkline: [],
          }).onConflictDoUpdate({
            target: marketQuotesTable.symbol,
            set: {
              name: q.longName ?? q.shortName ?? q.symbol,
              price: String(price),
              change: String(change),
              changePercent: String(changePercent),
              volume: String(volume),
              high24h: high !== null ? String(high) : null,
              low24h: low !== null ? String(low) : null,
              marketCap: marketCap !== null ? String(marketCap) : null,
              currency,
              marketStatus: status,
              updatedAt: new Date(),
            },
          });
        } catch (err) {
          logger.warn({ symbol: q.symbol, err }, "Failed to upsert quote");
        }
      }
    } catch (err) {
      logger.warn({ chunk, err }, "Failed to fetch chunk of quotes");
    }
  }
}

export async function fetchSparklines(symbols: string[]): Promise<void> {
  for (const symbol of symbols) {
    try {
      const historical = await yahooFinance.historical(symbol, {
        period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        period2: new Date(),
        interval: "1d",
      });
      const closes = historical.map((h) => h.close ?? 0).slice(-7);
      await db.update(marketQuotesTable)
        .set({ sparkline: closes })
        .where(eq(marketQuotesTable.symbol, symbol));
    } catch (err) {
      logger.debug({ symbol, err }, "Failed to fetch sparkline");
    }
  }
}

export async function fetchHistory(
  symbol: string,
  period: string = "1mo",
  interval: string = "1d"
): Promise<Array<{ timestamp: Date; open: number; high: number; low: number; close: number; volume: number }>> {
  const periodToMs: Record<string, number> = {
    "1d": 1 * 24 * 60 * 60 * 1000,
    "5d": 5 * 24 * 60 * 60 * 1000,
    "1mo": 30 * 24 * 60 * 60 * 1000,
    "3mo": 90 * 24 * 60 * 60 * 1000,
    "6mo": 180 * 24 * 60 * 60 * 1000,
    "1y": 365 * 24 * 60 * 60 * 1000,
    "5y": 5 * 365 * 24 * 60 * 60 * 1000,
  };
  const intervalMap: Record<string, "1d" | "1wk" | "1mo"> = {
    "1d": "1d", "1h": "1d", "5m": "1d", "15m": "1d",
    "1wk": "1wk", "1mo": "1mo",
  };

  const ms = periodToMs[period] ?? periodToMs["1mo"];
  const yInterval = intervalMap[interval] ?? "1d";
  const period1 = new Date(Date.now() - ms);

  const data = await yahooFinance.historical(symbol, { period1, period2: new Date(), interval: yInterval });
  return data.map((d) => ({
    timestamp: d.date,
    open: d.open ?? 0,
    high: d.high ?? 0,
    low: d.low ?? 0,
    close: d.close ?? 0,
    volume: d.volume ?? 0,
  }));
}

export async function fetchCompanyInfo(symbol: string) {
  try {
    const [quoteSummary, price] = await Promise.all([
      yahooFinance.quoteSummary(symbol, {
        modules: ["summaryProfile", "financialData", "defaultKeyStatistics", "assetProfile"],
      }),
      yahooFinance.quote(symbol),
    ]);

    const profile = quoteSummary.summaryProfile;
    const financial = quoteSummary.financialData;
    const stats = quoteSummary.defaultKeyStatistics;

    return {
      symbol,
      name: (price as any).longName ?? (price as any).shortName ?? symbol,
      price: (price as any).regularMarketPrice ?? 0,
      change: (price as any).regularMarketChange ?? 0,
      changePercent: (price as any).regularMarketChangePercent ?? 0,
      marketCap: (price as any).marketCap ?? null,
      revenue: financial?.totalRevenue ?? null,
      netIncome: financial?.netIncomeToCommon ?? null,
      peRatio: stats?.forwardPE ?? (price as any).trailingPE ?? null,
      eps: stats?.trailingEps ?? null,
      debtToEquity: financial?.debtToEquity ?? null,
      dividendYield: (price as any).dividendYield ?? null,
      sector: profile?.sector ?? null,
      industry: profile?.industry ?? null,
      description: profile?.longBusinessSummary ?? null,
      employees: profile?.fullTimeEmployees ?? null,
      country: profile?.country ?? null,
      website: profile?.website ?? null,
    };
  } catch (err) {
    logger.warn({ symbol, err }, "Failed to fetch company info");
    throw err;
  }
}

export async function getAllActiveSymbols(): Promise<string[]> {
  try {
    const assets = await db.select().from(trackedAssetsTable).where(eq(trackedAssetsTable.isActive, true));
    if (assets.length > 0) return assets.map((a) => a.symbol);
  } catch {
    // fall through to defaults
  }
  return Object.values(DEFAULT_SYMBOLS).flat();
}

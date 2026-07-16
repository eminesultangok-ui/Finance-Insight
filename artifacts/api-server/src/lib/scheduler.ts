import cron from "node-cron";
import { fetchAndStoreQuotes, fetchSparklines, getAllActiveSymbols } from "./market-data";
import { fetchAndStoreNews } from "./news-fetcher";
import { generateAndStoreAiSummary } from "./ai-summary";
import { logger } from "./logger";

let initialized = false;

export function startScheduler(): void {
  if (initialized) return;
  initialized = true;

  // Fetch market data every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    logger.info("Running scheduled market data fetch");
    try {
      const symbols = await getAllActiveSymbols();
      await fetchAndStoreQuotes(symbols);
    } catch (err) {
      logger.error({ err }, "Scheduled market data fetch failed");
    }
  });

  // Refresh sparklines every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    logger.info("Running scheduled sparkline fetch");
    try {
      const symbols = await getAllActiveSymbols();
      // Only fetch sparklines for first 20 symbols to avoid rate limits
      await fetchSparklines(symbols.slice(0, 20));
    } catch (err) {
      logger.error({ err }, "Scheduled sparkline fetch failed");
    }
  });

  // Fetch news every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    logger.info("Running scheduled news fetch");
    try {
      await fetchAndStoreNews();
    } catch (err) {
      logger.error({ err }, "Scheduled news fetch failed");
    }
  });

  // Generate morning AI summary at 08:00 UTC on weekdays
  cron.schedule("0 8 * * 1-5", async () => {
    logger.info("Generating morning AI summary");
    await generateAndStoreAiSummary("morning");
  });

  // Generate closing AI summary at 22:00 UTC on weekdays
  cron.schedule("0 22 * * 1-5", async () => {
    logger.info("Generating closing AI summary");
    await generateAndStoreAiSummary("closing");
  });

  logger.info("Scheduler started");
}

export async function runInitialDataFetch(): Promise<void> {
  logger.info("Running initial data fetch on startup");
  try {
    const symbols = await getAllActiveSymbols();
    await fetchAndStoreQuotes(symbols);
    await fetchSparklines(symbols.slice(0, 20));
    await fetchAndStoreNews();
    logger.info("Initial data fetch complete");
  } catch (err) {
    logger.warn({ err }, "Initial data fetch had errors (non-fatal)");
  }
}

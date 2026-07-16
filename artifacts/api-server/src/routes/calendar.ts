import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { economicEventsTable } from "@workspace/db";
import { gte, eq, and, lte } from "drizzle-orm";
import { GetEconomicCalendarQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/calendar", async (req, res): Promise<void> => {
  const parsed = GetEconomicCalendarQueryParams.safeParse(req.query);
  const importance = parsed.success ? parsed.data.importance : undefined;
  const country = parsed.success ? parsed.data.country : undefined;
  const days = parsed.success ? (parsed.data.days ?? 7) : 7;

  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  let query = db.select().from(economicEventsTable)
    .where(and(
      gte(economicEventsTable.eventDate, now),
      lte(economicEventsTable.eventDate, until)
    )) as any;

  if (importance && importance !== "all") {
    query = db.select().from(economicEventsTable)
      .where(and(
        gte(economicEventsTable.eventDate, now),
        lte(economicEventsTable.eventDate, until),
        eq(economicEventsTable.importance, importance)
      ));
  }

  if (country) {
    query = db.select().from(economicEventsTable)
      .where(and(
        gte(economicEventsTable.eventDate, now),
        lte(economicEventsTable.eventDate, until),
        eq(economicEventsTable.country, country)
      ));
  }

  const events = await query;

  res.json(
    events.map((e: typeof economicEventsTable.$inferSelect) => ({
      id: e.id,
      name: e.name,
      country: e.country,
      eventDate: e.eventDate.toISOString(),
      importance: e.importance,
      actual: e.actual ?? null,
      forecast: e.forecast ?? null,
      previous: e.previous ?? null,
      description: e.description ?? null,
      category: e.category ?? null,
    }))
  );
});

export default router;

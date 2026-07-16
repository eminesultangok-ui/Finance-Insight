import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  trackedAssetsTable,
  newsSourcesTable,
  economicEventsTable,
  dashboardSettingsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateAdminAssetBody,
  UpdateAdminAssetParams,
  UpdateAdminAssetBody,
  DeleteAdminAssetParams,
  CreateAdminNewsSourceBody,
  DeleteAdminNewsSourceParams,
  CreateAdminCalendarEventBody,
  UpdateAdminCalendarEventParams,
  UpdateAdminCalendarEventBody,
  DeleteAdminCalendarEventParams,
  UpdateAdminSettingsBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ─── ASSETS ───────────────────────────────────────────────────────────────────

router.get("/admin/assets", async (_req, res): Promise<void> => {
  const assets = await db.select().from(trackedAssetsTable).orderBy(trackedAssetsTable.createdAt);
  res.json(assets.map((a) => ({
    id: a.id,
    symbol: a.symbol,
    name: a.name,
    category: a.category,
    isActive: a.isActive,
    createdAt: a.createdAt.toISOString(),
  })));
});

router.post("/admin/assets", async (req, res): Promise<void> => {
  const parsed = CreateAdminAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [asset] = await db.insert(trackedAssetsTable).values({
    symbol: parsed.data.symbol.toUpperCase(),
    name: parsed.data.name,
    category: parsed.data.category,
  }).returning();
  res.status(201).json({
    id: asset!.id,
    symbol: asset!.symbol,
    name: asset!.name,
    category: asset!.category,
    isActive: asset!.isActive,
    createdAt: asset!.createdAt.toISOString(),
  });
});

router.put("/admin/assets/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAdminAssetParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateAdminAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [asset] = await db.update(trackedAssetsTable)
    .set(parsed.data)
    .where(eq(trackedAssetsTable.id, params.data.id))
    .returning();
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.json({
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    category: asset.category,
    isActive: asset.isActive,
    createdAt: asset.createdAt.toISOString(),
  });
});

router.delete("/admin/assets/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAdminAssetParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(trackedAssetsTable).where(eq(trackedAssetsTable.id, params.data.id));
  res.sendStatus(204);
});

// ─── NEWS SOURCES ─────────────────────────────────────────────────────────────

router.get("/admin/news-sources", async (_req, res): Promise<void> => {
  const sources = await db.select().from(newsSourcesTable).orderBy(newsSourcesTable.createdAt);
  res.json(sources.map((s) => ({
    id: s.id,
    name: s.name,
    url: s.url,
    type: s.type,
    category: s.category ?? null,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/admin/news-sources", async (req, res): Promise<void> => {
  const parsed = CreateAdminNewsSourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [source] = await db.insert(newsSourcesTable).values(parsed.data).returning();
  res.status(201).json({
    id: source!.id,
    name: source!.name,
    url: source!.url,
    type: source!.type,
    category: source!.category ?? null,
    isActive: source!.isActive,
    createdAt: source!.createdAt.toISOString(),
  });
});

router.delete("/admin/news-sources/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAdminNewsSourceParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(newsSourcesTable).where(eq(newsSourcesTable.id, params.data.id));
  res.sendStatus(204);
});

// ─── CALENDAR EVENTS ──────────────────────────────────────────────────────────

router.get("/admin/calendar-events", async (_req, res): Promise<void> => {
  const events = await db.select().from(economicEventsTable).orderBy(economicEventsTable.eventDate);
  res.json(events.map((e) => ({
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
  })));
});

router.post("/admin/calendar-events", async (req, res): Promise<void> => {
  const parsed = CreateAdminCalendarEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db.insert(economicEventsTable).values({
    name: parsed.data.name,
    country: parsed.data.country,
    eventDate: parsed.data.eventDate,
    importance: parsed.data.importance,
    actual: parsed.data.actual ?? null,
    forecast: parsed.data.forecast ?? null,
    previous: parsed.data.previous ?? null,
    description: parsed.data.description ?? null,
    category: parsed.data.category ?? null,
  }).returning();
  res.status(201).json({
    id: event!.id,
    name: event!.name,
    country: event!.country,
    eventDate: event!.eventDate.toISOString(),
    importance: event!.importance,
    actual: event!.actual ?? null,
    forecast: event!.forecast ?? null,
    previous: event!.previous ?? null,
    description: event!.description ?? null,
    category: event!.category ?? null,
  });
});

router.put("/admin/calendar-events/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAdminCalendarEventParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateAdminCalendarEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db.update(economicEventsTable)
    .set({
      name: parsed.data.name,
      country: parsed.data.country,
      eventDate: parsed.data.eventDate,
      importance: parsed.data.importance,
      actual: parsed.data.actual ?? null,
      forecast: parsed.data.forecast ?? null,
      previous: parsed.data.previous ?? null,
      description: parsed.data.description ?? null,
      category: parsed.data.category ?? null,
    })
    .where(eq(economicEventsTable.id, params.data.id))
    .returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json({
    id: event.id,
    name: event.name,
    country: event.country,
    eventDate: event.eventDate.toISOString(),
    importance: event.importance,
    actual: event.actual ?? null,
    forecast: event.forecast ?? null,
    previous: event.previous ?? null,
    description: event.description ?? null,
    category: event.category ?? null,
  });
});

router.delete("/admin/calendar-events/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAdminCalendarEventParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(economicEventsTable).where(eq(economicEventsTable.id, params.data.id));
  res.sendStatus(204);
});

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

router.get("/admin/settings", async (_req, res): Promise<void> => {
  const [settings] = await db.select().from(dashboardSettingsTable).limit(1);
  if (!settings) {
    // Return defaults if no row exists
    res.json({
      refreshInterval: 300,
      defaultCategory: "all",
      theme: "matrix",
      enableAiSummaries: true,
      aiSummarySchedule: null,
    });
    return;
  }
  res.json({
    refreshInterval: settings.refreshInterval,
    defaultCategory: settings.defaultCategory,
    theme: settings.theme,
    enableAiSummaries: settings.enableAiSummaries,
    aiSummarySchedule: settings.aiSummarySchedule ?? null,
  });
});

router.put("/admin/settings", async (req, res): Promise<void> => {
  const parsed = UpdateAdminSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(dashboardSettingsTable).limit(1);

  if (existing) {
    const [updated] = await db.update(dashboardSettingsTable)
      .set(parsed.data)
      .where(eq(dashboardSettingsTable.id, existing.id))
      .returning();
    res.json({
      refreshInterval: updated!.refreshInterval,
      defaultCategory: updated!.defaultCategory,
      theme: updated!.theme,
      enableAiSummaries: updated!.enableAiSummaries,
      aiSummarySchedule: updated!.aiSummarySchedule ?? null,
    });
  } else {
    const [created] = await db.insert(dashboardSettingsTable).values({
      refreshInterval: parsed.data.refreshInterval ?? 300,
      defaultCategory: parsed.data.defaultCategory ?? "all",
      theme: parsed.data.theme ?? "matrix",
      enableAiSummaries: parsed.data.enableAiSummaries ?? true,
      aiSummarySchedule: parsed.data.aiSummarySchedule ?? null,
    }).returning();
    res.json({
      refreshInterval: created!.refreshInterval,
      defaultCategory: created!.defaultCategory,
      theme: created!.theme,
      enableAiSummaries: created!.enableAiSummaries,
      aiSummarySchedule: created!.aiSummarySchedule ?? null,
    });
  }
});

export default router;

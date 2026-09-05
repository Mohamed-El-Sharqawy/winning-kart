import { and, desc, eq, gte, inArray, isNotNull, lte, ne, notLike, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { adAccounts, ads, adSets, campaigns, dailyInsights, db, syncJobs, syncRuns } from "@wk/db";
import type { AdAccount } from "@wk/db";
import type {
  AdFormat,
  CampaignRecord,
  EntityStatus,
  InsightRecord,
} from "../../platforms/meta";

export type CampaignRow = typeof campaigns.$inferSelect;
export type AdSetRow = typeof adSets.$inferSelect;
export type AdRow = typeof ads.$inferSelect;
export type SyncJobRow = typeof syncJobs.$inferSelect;
export type SyncRunRow = typeof syncRuns.$inferSelect;
export type SyncRunStatus = SyncRunRow["status"];

export interface AdSetUpsertRow {
  campaignId: string;
  platformAdsetId: string;
  name: string;
  status: EntityStatus;
  optimizationGoal: string | null;
  bidStrategy: string | null;
  dailyBudget: string | null;
  lifetimeBudget: string | null;
  platformUpdatedAt: Date | null;
}

export interface AdUpsertRow {
  adSetId: string;
  platformAdId: string;
  name: string;
  status: EntityStatus;
  format: AdFormat;
  creativeId: string | null;
  videoId: string | null;
  effectiveStoryId: string | null;
  carouselCount: number | null;
  thumbnailUrl: string | null;
  thumbnailResolvedAt: Date | null;
  platformUpdatedAt: Date | null;
}

export type AdMediaRow = Pick<
  typeof ads.$inferSelect,
  | "id"
  | "platformAdId"
  | "format"
  | "videoId"
  | "carouselCount"
  | "thumbnailUrl"
  | "thumbnailResolvedAt"
  | "posterUrl"
  | "posterResolvedAt"
  | "sourceUrl"
  | "sourceResolvedAt"
>;

export interface AdMediaPatch {
  thumbnailUrl?: string | null;
  thumbnailResolvedAt?: Date | null;
  posterUrl?: string | null;
  posterResolvedAt?: Date | null;
  sourceUrl?: string | null;
  sourceResolvedAt?: Date | null;
}

export interface PlatformEntityState {
  id: string;
  platformUpdatedAt: Date | null;
}

export interface RemovalPlan {
  campaigns: { id: string; platformId: string }[];
  adSets: { id: string; platformId: string }[];
  ads: { id: string; platformId: string }[];
}

export interface EntityStatusPatch {
  platformId: string;
  status: EntityStatus;
}

export interface InsightUpsertRow {
  entityLevel: "account" | "campaign" | "adset" | "ad";
  entityId: string;
  record: InsightRecord;
}

export interface CampaignWindowMetrics {
  entityId: string;
  spend: number;
  revenue: number;
  purchases: number;
  clicks: number;
  impressions: number;
  reach: number;
}

export type SyncStageName =
  | "account_info"
  | "campaigns"
  | "ad_sets"
  | "ads"
  | "insights"
  | "daily_series";

export interface SyncJobPatch {
  status: "succeeded" | "failed";
  errorClass?: string | null;
  detail?: unknown;
  endedAt: Date;
}

function parseSum(value: string | null): number {
  if (value === null) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class AdAccountsModel {
  listByClient(clientId: string) {
    return db
      .select({
        id: adAccounts.id,
        name: adAccounts.name,
        slug: adAccounts.slug,
        adAccountId: adAccounts.adAccountId,
        platform: adAccounts.platform,
        healthState: adAccounts.healthState,
        tokenType: adAccounts.tokenType,
        tokenExpiresAt: adAccounts.tokenExpiresAt,
        currency: adAccounts.currency,
        timezone: adAccounts.timezone,
        lastSyncAt: adAccounts.lastSyncAt,
        campaignCount: sql<number>`count(${campaigns.id})::int`,
      })
      .from(adAccounts)
      .leftJoin(campaigns, eq(campaigns.adAccountId, adAccounts.id))
      .where(eq(adAccounts.clientId, clientId))
      .groupBy(adAccounts.id)
      .orderBy(adAccounts.name);
  }

  async findById(id: string): Promise<AdAccount | undefined> {
    const rows = await db.select().from(adAccounts).where(eq(adAccounts.id, id)).limit(1);
    return rows[0];
  }

  async insertAdAccount(values: typeof adAccounts.$inferInsert): Promise<AdAccount> {
    const rows = await db.insert(adAccounts).values(values).returning();
    return rows[0];
  }

  async updateAdAccount(
    id: string,
    patch: Partial<typeof adAccounts.$inferInsert>
  ): Promise<AdAccount | undefined> {
    const rows = await db
      .update(adAccounts)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(adAccounts.id, id))
      .returning();
    return rows[0];
  }

  async deleteAdAccount(id: string): Promise<boolean> {
    const rows = await db.delete(adAccounts).where(eq(adAccounts.id, id)).returning({
      id: adAccounts.id,
    });
    return rows.length > 0;
  }

  async upsertCampaigns(
    adAccountId: string,
    currency: string,
    records: CampaignRecord[]
  ): Promise<CampaignRow[]> {
    if (records.length === 0) {
      return [];
    }
    return db
      .insert(campaigns)
      .values(
        records.map((record) => ({
          id: crypto.randomUUID(),
          adAccountId,
          platformCampaignId: record.platformCampaignId,
          name: record.name,
          status: record.status,
          objective: record.objective,
          buyingType: record.buyingType,
          dailyBudget: record.dailyBudget,
          lifetimeBudget: record.lifetimeBudget,
          currency,
          scheduleStart: record.scheduleStart,
          scheduleEnd: record.scheduleEnd,
          platformUpdatedAt: record.platformUpdatedAt,
          updatedAt: new Date(),
        }))
      )
      .onConflictDoUpdate({
        target: [campaigns.adAccountId, campaigns.platformCampaignId],
        set: {
          name: sql`excluded.name`,
          status: sql`excluded.status`,
          objective: sql`excluded.objective`,
          buyingType: sql`excluded.buying_type`,
          dailyBudget: sql`excluded.daily_budget`,
          lifetimeBudget: sql`excluded.lifetime_budget`,
          currency: sql`excluded.currency`,
          scheduleStart: sql`excluded.schedule_start`,
          scheduleEnd: sql`excluded.schedule_end`,
          platformUpdatedAt: sql`excluded.platform_updated_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
      .returning();
  }

  async upsertAdSets(rows: AdSetUpsertRow[]): Promise<AdSetRow[]> {
    if (rows.length === 0) {
      return [];
    }
    return db
      .insert(adSets)
      .values(
        rows.map((row) => ({
          id: crypto.randomUUID(),
          campaignId: row.campaignId,
          platformAdsetId: row.platformAdsetId,
          name: row.name,
          status: row.status,
          optimizationGoal: row.optimizationGoal,
          bidStrategy: row.bidStrategy,
          dailyBudget: row.dailyBudget,
          lifetimeBudget: row.lifetimeBudget,
          platformUpdatedAt: row.platformUpdatedAt,
          updatedAt: new Date(),
        }))
      )
      .onConflictDoUpdate({
        target: [adSets.campaignId, adSets.platformAdsetId],
        set: {
          name: sql`excluded.name`,
          status: sql`excluded.status`,
          optimizationGoal: sql`excluded.optimization_goal`,
          bidStrategy: sql`excluded.bid_strategy`,
          dailyBudget: sql`excluded.daily_budget`,
          lifetimeBudget: sql`excluded.lifetime_budget`,
          platformUpdatedAt: sql`excluded.platform_updated_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
      .returning();
  }

  async upsertAds(rows: AdUpsertRow[]): Promise<AdRow[]> {
    if (rows.length === 0) {
      return [];
    }
    return db
      .insert(ads)
      .values(
        rows.map((row) => ({
          id: crypto.randomUUID(),
          adSetId: row.adSetId,
          platformAdId: row.platformAdId,
          name: row.name,
          status: row.status,
          format: row.format,
          creativeId: row.creativeId,
          videoId: row.videoId,
          effectiveStoryId: row.effectiveStoryId,
          carouselCount: row.carouselCount,
          thumbnailUrl: row.thumbnailUrl,
          thumbnailResolvedAt: row.thumbnailResolvedAt,
          platformUpdatedAt: row.platformUpdatedAt,
          updatedAt: new Date(),
        }))
      )
      .onConflictDoUpdate({
        target: [ads.adSetId, ads.platformAdId],
        set: {
          name: sql`excluded.name`,
          status: sql`excluded.status`,
          format: sql`excluded.format`,
          creativeId: sql`excluded.creative_id`,
          videoId: sql`coalesce(excluded.video_id, ${ads.videoId})`,
          effectiveStoryId: sql`coalesce(excluded.effective_story_id, ${ads.effectiveStoryId})`,
          carouselCount: sql`coalesce(excluded.carousel_count, ${ads.carouselCount})`,
          thumbnailUrl: sql`coalesce(excluded.thumbnail_url, ${ads.thumbnailUrl})`,
          thumbnailResolvedAt: sql`coalesce(excluded.thumbnail_resolved_at, ${ads.thumbnailResolvedAt})`,
          platformUpdatedAt: sql`excluded.platform_updated_at`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
      .returning();
  }

  async upsertInsights(
    adAccountId: string,
    currency: string,
    rows: InsightUpsertRow[]
  ): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    const inserted = await db
      .insert(dailyInsights)
      .values(
        rows.map(({ entityLevel, entityId, record }) => ({
          id: crypto.randomUUID(),
          adAccountId,
          entityLevel,
          entityId,
          date: record.date,
          spend: record.spend.toFixed(2),
          impressions: record.impressions,
          reach: record.reach,
          clicks: record.clicks,
          ctr: record.ctr.toFixed(2),
          cpc: record.cpc.toFixed(2),
          cpm: record.cpm.toFixed(2),
          frequency: record.frequency.toFixed(2),
          purchases: record.purchases,
          addToCart: record.addToCart,
          initiateCheckout: record.initiateCheckout,
          landingPageViews: record.landingPageViews,
          revenue: record.revenue.toFixed(2),
          currency,
        }))
      )
      .onConflictDoUpdate({
        target: [
          dailyInsights.adAccountId,
          dailyInsights.entityLevel,
          dailyInsights.entityId,
          dailyInsights.date,
        ],
        set: {
          spend: sql`excluded.spend`,
          impressions: sql`excluded.impressions`,
          reach: sql`excluded.reach`,
          clicks: sql`excluded.clicks`,
          ctr: sql`excluded.ctr`,
          cpc: sql`excluded.cpc`,
          cpm: sql`excluded.cpm`,
          frequency: sql`excluded.frequency`,
          purchases: sql`excluded.purchases`,
          addToCart: sql`excluded.add_to_cart`,
          initiateCheckout: sql`excluded.initiate_checkout`,
          landingPageViews: sql`excluded.landing_page_views`,
          revenue: sql`excluded.revenue`,
          currency: sql`excluded.currency`,
        },
      })
      .returning({ id: dailyInsights.id });
    return inserted.length;
  }

  async insertSyncJob(values: {
    id: string;
    adAccountId: string;
    stage: SyncStageName;
    status: "running";
    startedAt: Date;
  }): Promise<SyncJobRow> {
    const rows = await db.insert(syncJobs).values(values).returning();
    return rows[0];
  }

  async updateSyncJob(id: string, patch: SyncJobPatch): Promise<void> {
    await db.update(syncJobs).set(patch).where(eq(syncJobs.id, id));
  }

  listRecentJobs(adAccountId: string, limit: number): Promise<SyncJobRow[]> {
    return db
      .select()
      .from(syncJobs)
      .where(eq(syncJobs.adAccountId, adAccountId))
      .orderBy(desc(syncJobs.startedAt))
      .limit(limit);
  }

  async listSyncEligible(): Promise<{ id: string }[]> {
    return db
      .select({ id: adAccounts.id })
      .from(adAccounts)
      .where(
        and(
          inArray(adAccounts.healthState, ["healthy", "warning"]),
          notLike(adAccounts.accessTokenEncrypted, "pending-oauth%")
        )
      );
  }

  async createSyncRun(
    id: string,
    adAccountId: string,
    progress?: unknown
  ): Promise<SyncRunRow> {
    const rows = await db
      .insert(syncRuns)
      .values({ id, adAccountId, status: "queued", ...(progress === undefined ? {} : { progress }) })
      .returning();
    return rows[0];
  }

  async updateSyncRun(
    id: string,
    patch: {
      status?: SyncRunStatus;
      progress?: unknown;
      error?: string | null;
      errorClass?: string | null;
      graphCalls?: number | null;
      startedAt?: Date;
      endedAt?: Date;
    }
  ): Promise<void> {
    await db.update(syncRuns).set(patch).where(eq(syncRuns.id, id));
  }

  async getSyncRun(id: string): Promise<SyncRunRow | null> {
    const rows = await db.select().from(syncRuns).where(eq(syncRuns.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async latestSyncRun(adAccountId: string): Promise<SyncRunRow | null> {
    const rows = await db
      .select()
      .from(syncRuns)
      .where(eq(syncRuns.adAccountId, adAccountId))
      .orderBy(desc(syncRuns.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }

  async activeSyncRun(adAccountId: string): Promise<SyncRunRow | null> {
    const rows = await db
      .select()
      .from(syncRuns)
      .where(
        and(
          eq(syncRuns.adAccountId, adAccountId),
          inArray(syncRuns.status, ["queued", "running"])
        )
      )
      .orderBy(desc(syncRuns.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }

  async markStaleSyncRunsInterrupted(): Promise<void> {
    await db
      .update(syncRuns)
      .set({ status: "interrupted", endedAt: new Date() })
      .where(inArray(syncRuns.status, ["queued", "running"]));
  }

  async oldestQueuedSyncRun(): Promise<SyncRunRow | null> {
    const rows = await db
      .select()
      .from(syncRuns)
      .where(eq(syncRuns.status, "queued"))
      .orderBy(syncRuns.createdAt)
      .limit(1);
    return rows[0] ?? null;
  }

  listUserTokenExpiries(): Promise<{ id: string; tokenExpiresAt: Date | null }[]> {
    return db
      .select({ id: adAccounts.id, tokenExpiresAt: adAccounts.tokenExpiresAt })
      .from(adAccounts)
      .where(
        and(
          eq(adAccounts.tokenType, "user_60d"),
          isNotNull(adAccounts.tokenExpiresAt)
        )
      );
  }

  async setHealthState(id: string, state: "error"): Promise<void> {
    await db
      .update(adAccounts)
      .set({ healthState: state, updatedAt: new Date() })
      .where(eq(adAccounts.id, id));
  }

  async setHealthStateIfNotError(id: string, state: "warning"): Promise<void> {
    await db
      .update(adAccounts)
      .set({ healthState: state, updatedAt: new Date() })
      .where(and(eq(adAccounts.id, id), ne(adAccounts.healthState, "error")));
  }

  async campaignMetricsWindow(since: string, until: string): Promise<CampaignWindowMetrics[]> {
    const rows = await db
      .select({
        entityId: dailyInsights.entityId,
        spend: sql<string>`sum(${dailyInsights.spend})`,
        revenue: sql<string>`sum(${dailyInsights.revenue})`,
        purchases: sql<string>`sum(${dailyInsights.purchases})`,
        clicks: sql<string>`sum(${dailyInsights.clicks})`,
        impressions: sql<string>`sum(${dailyInsights.impressions})`,
        reach: sql<string>`sum(${dailyInsights.reach})`,
      })
      .from(dailyInsights)
      .where(
        and(
          eq(dailyInsights.entityLevel, "campaign"),
          gte(dailyInsights.date, since),
          lte(dailyInsights.date, until)
        )
      )
      .groupBy(dailyInsights.entityId);
    return rows.map((row) => ({
      entityId: row.entityId,
      spend: parseSum(row.spend),
      revenue: parseSum(row.revenue),
      purchases: Math.round(parseSum(row.purchases)),
      clicks: Math.round(parseSum(row.clicks)),
      impressions: Math.round(parseSum(row.impressions)),
      reach: Math.round(parseSum(row.reach)),
    }));
  }

  listCampaignsByAccount(adAccountId: string): Promise<CampaignRow[]> {
    return db
      .select()
      .from(campaigns)
      .where(eq(campaigns.adAccountId, adAccountId))
      .orderBy(campaigns.name);
  }

  updateCampaignStatuses(adAccountId: string, patches: EntityStatusPatch[]): Promise<void> {
    return applyStatusPatches(patches, (values) => sql`
      update campaigns as t set status = v.status
      from (values ${values}) as v(platform_id, status)
      where t.platform_campaign_id = v.platform_id and t.ad_account_id = ${adAccountId}
    `);
  }

  updateAdSetStatuses(adAccountId: string, patches: EntityStatusPatch[]): Promise<void> {
    return applyStatusPatches(patches, (values) => sql`
      update ad_sets as t set status = v.status
      from (values ${values}) as v(platform_id, status), campaigns c
      where t.platform_adset_id = v.platform_id
        and c.id = t.campaign_id and c.ad_account_id = ${adAccountId}
    `);
  }

  updateAdStatuses(adAccountId: string, patches: EntityStatusPatch[]): Promise<void> {
    return applyStatusPatches(patches, (values) => sql`
      update ads as t set status = v.status
      from (values ${values}) as v(platform_id, status), ad_sets s, campaigns c
      where t.platform_ad_id = v.platform_id
        and s.id = t.ad_set_id and c.id = s.campaign_id and c.ad_account_id = ${adAccountId}
    `);
  }

  async campaignStates(adAccountId: string): Promise<Map<string, PlatformEntityState>> {
    const rows = await db
      .select({
        id: campaigns.id,
        platformId: campaigns.platformCampaignId,
        platformUpdatedAt: campaigns.platformUpdatedAt,
      })
      .from(campaigns)
      .where(eq(campaigns.adAccountId, adAccountId));
    return new Map(rows.map((row) => [row.platformId, toState(row)]));
  }

  async adSetStates(adAccountId: string): Promise<Map<string, PlatformEntityState>> {
    const rows = await db
      .select({
        id: adSets.id,
        platformId: adSets.platformAdsetId,
        platformUpdatedAt: adSets.platformUpdatedAt,
      })
      .from(adSets)
      .innerJoin(campaigns, eq(adSets.campaignId, campaigns.id))
      .where(eq(campaigns.adAccountId, adAccountId));
    return new Map(rows.map((row) => [row.platformId, toState(row)]));
  }

  async adStates(adAccountId: string): Promise<Map<string, PlatformEntityState>> {
    const rows = await db
      .select({
        id: ads.id,
        platformId: ads.platformAdId,
        platformUpdatedAt: ads.platformUpdatedAt,
      })
      .from(ads)
      .innerJoin(adSets, eq(ads.adSetId, adSets.id))
      .innerJoin(campaigns, eq(adSets.campaignId, campaigns.id))
      .where(eq(campaigns.adAccountId, adAccountId));
    return new Map(rows.map((row) => [row.platformId, toState(row)]));
  }

  async findAdsMediaByIds(adAccountId: string, ids: string[]): Promise<AdMediaRow[]> {
    if (ids.length === 0) {
      return [];
    }
    return db
      .select({
        id: ads.id,
        platformAdId: ads.platformAdId,
        format: ads.format,
        videoId: ads.videoId,
        carouselCount: ads.carouselCount,
        thumbnailUrl: ads.thumbnailUrl,
        thumbnailResolvedAt: ads.thumbnailResolvedAt,
        posterUrl: ads.posterUrl,
        posterResolvedAt: ads.posterResolvedAt,
        sourceUrl: ads.sourceUrl,
        sourceResolvedAt: ads.sourceResolvedAt,
      })
      .from(ads)
      .innerJoin(adSets, eq(ads.adSetId, adSets.id))
      .innerJoin(campaigns, eq(adSets.campaignId, campaigns.id))
      .where(and(eq(campaigns.adAccountId, adAccountId), inArray(ads.id, ids)));
  }

  async updateAdMedia(id: string, patch: AdMediaPatch): Promise<void> {
    await db
      .update(ads)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(ads.id, id));
  }

  async applyAbsenceCleanup(
    adAccountId: string,
    plan: RemovalPlan,
    purgeEntityIds: string[]
  ): Promise<number> {
    return db.transaction(async (tx) => {
      const removedCampaignIds = plan.campaigns.map((entity) => entity.id);
      const removedAdSetIds = plan.adSets.map((entity) => entity.id);
      const cascadeAdSets =
        removedCampaignIds.length > 0
          ? await tx
              .select({ id: adSets.id })
              .from(adSets)
              .where(inArray(adSets.campaignId, removedCampaignIds))
          : [];
      const cascadeAdSetIds = cascadeAdSets.map((row) => row.id);
      const cascadeAdParents = [...removedAdSetIds, ...cascadeAdSetIds];
      const cascadeAds =
        cascadeAdParents.length > 0
          ? await tx.select({ id: ads.id }).from(ads).where(inArray(ads.adSetId, cascadeAdParents))
          : [];
      const purgeIds = dedupeIds([
        ...purgeEntityIds,
        ...cascadeAdSetIds,
        ...cascadeAds.map((row) => row.id),
      ]);
      let purgedInsightRows = 0;
      for (let index = 0; index < purgeIds.length; index += DELETE_CHUNK) {
        const rows = await tx
          .delete(dailyInsights)
          .where(
            and(
              eq(dailyInsights.adAccountId, adAccountId),
              ne(dailyInsights.entityLevel, "account"),
              inArray(dailyInsights.entityId, purgeIds.slice(index, index + DELETE_CHUNK))
            )
          )
          .returning({ id: dailyInsights.id });
        purgedInsightRows += rows.length;
      }
      await deleteInChunks(
        plan.campaigns.map((entity) => entity.platformId),
        (chunk) =>
          tx
            .delete(campaigns)
            .where(
              and(
                eq(campaigns.adAccountId, adAccountId),
                inArray(campaigns.platformCampaignId, chunk)
              )
            )
            .returning({ id: campaigns.id })
      );
      await deleteInChunks(
        plan.adSets.map((entity) => entity.platformId),
        (chunk) =>
          tx
            .delete(adSets)
            .where(
              and(
                inArray(adSets.platformAdsetId, chunk),
                inArray(
                  adSets.campaignId,
                  tx
                    .select({ id: campaigns.id })
                    .from(campaigns)
                    .where(eq(campaigns.adAccountId, adAccountId))
                )
              )
            )
            .returning({ id: adSets.id })
      );
      await deleteInChunks(
        plan.ads.map((entity) => entity.platformId),
        (chunk) =>
          tx
            .delete(ads)
            .where(
              and(
                inArray(ads.platformAdId, chunk),
                inArray(
                  ads.adSetId,
                  tx
                    .select({ id: adSets.id })
                    .from(adSets)
                    .innerJoin(campaigns, eq(adSets.campaignId, campaigns.id))
                    .where(eq(campaigns.adAccountId, adAccountId))
                )
              )
            )
            .returning({ id: ads.id })
      );
      return purgedInsightRows;
    });
  }
}

function toState(row: {
  id: string;
  platformUpdatedAt: Date | null;
}): PlatformEntityState {
  return { id: row.id, platformUpdatedAt: row.platformUpdatedAt };
}

const STATUS_PATCH_CHUNK = 1000;
const DELETE_CHUNK = 1000;

async function deleteInChunks(
  ids: string[],
  statement: (chunk: string[]) => Promise<{ id: string }[]>
): Promise<string[]> {
  const deleted: string[] = [];
  for (let index = 0; index < ids.length; index += DELETE_CHUNK) {
    const chunk = ids.slice(index, index + DELETE_CHUNK);
    const rows = await statement(chunk);
    deleted.push(...rows.map((row) => row.id));
  }
  return deleted;
}

function dedupeIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

async function applyStatusPatches(
  patches: EntityStatusPatch[],
  statement: (values: SQL) => SQL
): Promise<void> {
  for (let index = 0; index < patches.length; index += STATUS_PATCH_CHUNK) {
    const chunk = patches.slice(index, index + STATUS_PATCH_CHUNK);
    const values = sql.join(
      chunk.map((patch) => sql`(${patch.platformId}::text, ${patch.status}::text)`),
      sql`, `
    );
    await db.execute(statement(values));
  }
}

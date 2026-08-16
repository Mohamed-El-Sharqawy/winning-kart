import { randomBytes } from "node:crypto";
import { recordAudit } from "../../lib/audit";
import { sha256Hex } from "../../lib/crypto";
import { problem } from "../../lib/problem";
import type { MatchTier, ResolvedEntityLevel, TierSummaryRow } from "./model";
import type { RevenueModel } from "./model";

export type { MatchTier, ResolvedEntityLevel };

export interface IngestClickIds {
  fbclid?: string;
  _fbp?: string;
  _fbc?: string;
  gclid?: string;
}

export interface IngestUtm {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

export interface IngestBody {
  source_order_id: string;
  timestamp: string;
  value: number;
  currency?: string;
  status?: "paid" | "refunded" | "cancelled";
  customer_ref?: string;
  click_id?: IngestClickIds;
  utm?: IngestUtm;
  items?: unknown[];
}

export interface AuditRequestContext {
  ip?: string;
  userAgent?: string;
}

export interface IngestResult {
  accepted: boolean;
  match_quality: MatchTier;
  deduped: boolean;
}

export interface ClientRevenueEvent {
  id: string;
  sourceOrderId: string;
  tsUtc: Date;
  value: number;
  currency: string;
  matchTier: MatchTier;
  resolvedEntityLevel: ResolvedEntityLevel;
  resolvedEntityId: string | null;
  campaignName: string | null;
  sourceName: string;
}

export interface TierSummary {
  count: number;
  value: number;
}

export interface ClientRevenueSummary {
  totalValue: number;
  currency: string;
  count: number;
  tierA: TierSummary;
  tierB: TierSummary;
  tierC: TierSummary;
  matchedPct: number;
}

export interface ClientRevenueView {
  events: ClientRevenueEvent[];
  summary: ClientRevenueSummary;
}

export interface CreatedRevenueSource {
  id: string;
  name: string;
  createdAt: Date;
  ingestKey: string;
}

export interface RevenueSourceView {
  id: string;
  name: string;
  status: "active" | "revoked";
  lastEventAt: Date | null;
  createdAt: Date;
}

const DAY_MS = 86400000;
const EVENTS_LIMIT = 100;
const DEFAULT_DAYS = 30;
const MIN_DAYS = 1;
const MAX_DAYS = 90;
const INGEST_KEY_PATTERN = /^wkrev_[0-9a-f]+$/;

function invalidIngestKey() {
  return problem(401, "INVALID_INGEST_KEY", "Unknown or revoked ingest key");
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23503"
  );
}

function parseNumeric(value: string | null): number {
  if (value === null) {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function hasClickId(clickIds: IngestClickIds | undefined): boolean {
  if (clickIds === undefined) {
    return false;
  }
  return [clickIds.fbclid, clickIds._fbp, clickIds._fbc, clickIds.gclid].some(
    (value) => typeof value === "string" && value.length > 0
  );
}

function emptyTier(): TierSummary {
  return { count: 0, value: 0 };
}

export class RevenueService {
  constructor(private readonly model: RevenueModel) {}

  async ingest(input: {
    bearerKey: string | null;
    body: IngestBody;
    request: AuditRequestContext;
  }): Promise<IngestResult> {
    if (input.bearerKey === null || !INGEST_KEY_PATTERN.test(input.bearerKey)) {
      throw invalidIngestKey();
    }
    const source = await this.model.findActiveSourceByIngestKeyHash(
      sha256Hex(input.bearerKey)
    );
    if (!source) {
      throw invalidIngestKey();
    }
    if (!(input.body.value > 0)) {
      throw problem(422, "VALIDATION", "value must be greater than 0");
    }
    const tsUtc = new Date(input.body.timestamp);
    if (Number.isNaN(tsUtc.getTime())) {
      throw problem(422, "VALIDATION", "timestamp must be an ISO 8601 date string");
    }
    const dedupeKey = `${source.id}:${input.body.source_order_id}`;
    const existing = await this.model.findEventByDedupeKey(dedupeKey);
    if (existing) {
      return { accepted: true, match_quality: existing.matchTier, deduped: true };
    }
    const clickIds = input.body.click_id ?? null;
    const utm = input.body.utm ?? null;
    let tier: MatchTier = "C";
    let resolvedEntityLevel: ResolvedEntityLevel = null;
    let resolvedEntityId: string | null = null;
    if (hasClickId(input.body.click_id)) {
      tier = "A";
    } else if (typeof input.body.utm?.campaign === "string" && input.body.utm.campaign.length > 0) {
      const campaign = await this.model.findCampaignByNameForClient(
        source.clientId,
        input.body.utm.campaign
      );
      if (campaign) {
        tier = "B";
        resolvedEntityLevel = "campaign";
        resolvedEntityId = campaign.id;
      }
    }
    try {
      await this.model.insertEvent({
        id: crypto.randomUUID(),
        revenueSourceId: source.id,
        clientId: source.clientId,
        sourceOrderId: input.body.source_order_id,
        dedupeKey,
        tsUtc,
        value: input.body.value.toFixed(2),
        currency: (input.body.currency ?? "AED").toUpperCase(),
        customerRef: input.body.customer_ref ?? null,
        clickIds,
        utm,
        matchTier: tier,
        resolvedEntityLevel,
        resolvedEntityId,
        replacesEventId: null,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        const raced = await this.model.findEventByDedupeKey(dedupeKey);
        if (raced) {
          return { accepted: true, match_quality: raced.matchTier, deduped: true };
        }
      }
      throw error;
    }
    await this.model.touchSourceLastEventAt(source.id, new Date());
    void recordAudit({
      actorUserId: null,
      actorType: "api_token",
      action: "revenue.ingest",
      targetEntityType: "client",
      targetEntityId: source.clientId,
      request: { ip: input.request.ip, userAgent: input.request.userAgent },
    }).catch(() => {});
    return { accepted: true, match_quality: tier, deduped: false };
  }

  async listClientRevenue(clientId: string, days: number): Promise<ClientRevenueView> {
    const client = await this.model.findClientById(clientId);
    if (!client) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No client with id ${clientId}`);
    }
    const windowDays = Math.min(Math.max(
      Number.isFinite(days) ? days : DEFAULT_DAYS,
      MIN_DAYS
    ), MAX_DAYS);
    const since = new Date(Date.now() - windowDays * DAY_MS);
    const rows = await this.model.listEventsForClient(clientId, since, EVENTS_LIMIT);
    const tierRows = await this.model.summarizeTiersForClient(clientId, since);
    const events: ClientRevenueEvent[] = rows.map((row) => ({
      id: row.id,
      sourceOrderId: row.sourceOrderId,
      tsUtc: row.tsUtc,
      value: parseNumeric(row.value),
      currency: row.currency,
      matchTier: row.matchTier,
      resolvedEntityLevel: row.resolvedEntityLevel,
      resolvedEntityId: row.resolvedEntityId,
      campaignName: row.campaignName,
      sourceName: row.sourceName,
    }));
    const tiers: Record<MatchTier, TierSummary> = {
      A: emptyTier(),
      B: emptyTier(),
      C: emptyTier(),
    };
    for (const row of tierRows) {
      tiers[row.matchTier] = {
        count: row.count,
        value: round2(parseNumeric(row.total)),
      };
    }
    const count = tiers.A.count + tiers.B.count + tiers.C.count;
    const totalValue = round2(tiers.A.value + tiers.B.value + tiers.C.value);
    const matchedCount = tiers.A.count + tiers.B.count;
    const summary: ClientRevenueSummary = {
      totalValue,
      currency: "AED",
      count,
      tierA: tiers.A,
      tierB: tiers.B,
      tierC: tiers.C,
      matchedPct: count === 0 ? 0 : Math.round((matchedCount / count) * 10000) / 10000,
    };
    return { events, summary };
  }

  async createSource(input: {
    clientId: string;
    name: string;
    actorUserId: string;
    request: AuditRequestContext;
  }): Promise<CreatedRevenueSource> {
    const ingestKey = `wkrev_${randomBytes(16).toString("hex")}`;
    let source;
    try {
      source = await this.model.insertSource({
        id: crypto.randomUUID(),
        clientId: input.clientId,
        name: input.name,
        ingestKeyHash: sha256Hex(ingestKey),
        status: "active",
      });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw problem(404, "RESOURCE_NOT_FOUND", `No client with id ${input.clientId}`);
      }
      throw error;
    }
    void recordAudit({
      actorUserId: input.actorUserId,
      actorType: "user",
      action: "revenue_source.create",
      targetEntityType: "revenue_source",
      targetEntityId: source.id,
      newValue: { name: source.name },
      request: { ip: input.request.ip, userAgent: input.request.userAgent },
    }).catch(() => {});
    return {
      id: source.id,
      name: source.name,
      createdAt: source.createdAt,
      ingestKey,
    };
  }

  listSources(clientId: string): Promise<RevenueSourceView[]> {
    return this.model.listSourcesForClient(clientId);
  }

  async revokeSource(input: {
    clientId: string;
    id: string;
    confirmName: string;
    actorUserId: string;
    request: AuditRequestContext;
  }): Promise<void> {
    const source = await this.model.findSourceById(input.id);
    if (!source || source.clientId !== input.clientId) {
      throw problem(404, "RESOURCE_NOT_FOUND", `No revenue source with id ${input.id}`);
    }
    if (input.confirmName !== source.name) {
      throw problem(422, "NAME_MISMATCH", "confirmName does not match the revenue source name");
    }
    await this.model.updateSourceStatus(source.id, "revoked");
    void recordAudit({
      actorUserId: input.actorUserId,
      actorType: "user",
      action: "revenue_source.revoke",
      targetEntityType: "revenue_source",
      targetEntityId: source.id,
      newValue: { status: "revoked" },
      request: { ip: input.request.ip, userAgent: input.request.userAgent },
    }).catch(() => {});
  }
}

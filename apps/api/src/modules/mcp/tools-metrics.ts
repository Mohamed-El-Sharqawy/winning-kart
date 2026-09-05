import type { AlertListStatus } from "../alerts/model";
import { resolveWindow } from "../../lib/window";
import { ADS_FLAGS, ADS_FORMATS, ADS_ORDERS, ADS_SORTS } from "../performance/ads-query";
import type { AdsListQuery } from "../performance/ads-list";
import {
  McpTool,
  clampInt,
  invalidParams,
  optionalNumber,
  optionalString,
  requireString,
} from "./tools";

function optionalArgs(args: Record<string, unknown>, key: string): Partial<AdsListQuery> {
  const value = optionalString(args, key);
  return value === undefined ? {} : { [key]: value };
}

const ALERT_STATUSES = [
  "open",
  "all",
  "snoozed",
  "acknowledged",
  "suppressed",
  "dismissed",
] as const;

const getCampaigns: McpTool = {
  name: "get_campaigns",
  description: "Campaigns with spend, revenue, ROAS, CPA, and CTR for one ad account",
  inputSchema: {
    type: "object",
    properties: {
      adAccountId: { type: "string" },
      days: { type: "number" },
    },
    required: ["adAccountId"],
  },
  handler: async (ctx, args) => {
    const adAccountId = requireString(args, "adAccountId");
    const days = clampInt(optionalNumber(args, "days") ?? 30, 1, 90);
    return ctx.models.adAccounts.campaignsWithMetrics(adAccountId, resolveWindow({ days }));
  },
};

const getAlerts: McpTool = {
  name: "get_alerts",
  description: "Alerts ordered by priority with severity, trigger, and client name",
  inputSchema: {
    type: "object",
    properties: {
      status: { type: "string", enum: [...ALERT_STATUSES] },
      limit: { type: "number" },
    },
  },
  handler: async (ctx, args) => {
    const status = optionalString(args, "status") ?? "open";
    if (!(ALERT_STATUSES as readonly string[]).includes(status)) {
      throw invalidParams();
    }
    const limit = clampInt(optionalNumber(args, "limit") ?? 20, 1, 100);
    const rows = await ctx.models.alerts.list({ status: status as AlertListStatus });
    return rows.slice(0, limit).map((row) => ({
      id: row.id,
      severity: row.severity,
      triggerType: row.triggerType,
      whatHappened: row.whatHappened,
      entityName: row.entityName,
      clientName: row.clientName,
      status: row.status,
      priorityScore: Number(row.priorityScore),
    }));
  },
};

const ADS_ENUM_PARAMS: Record<string, readonly string[]> = {
  flag: ADS_FLAGS,
  format: ADS_FORMATS,
  sort: ADS_SORTS,
  order: ADS_ORDERS,
};

const getAds: McpTool = {
  name: "get_ads",
  description:
    "Ads (creatives gallery) for one ad account: window metrics, spend share, trend, and fatigue flags with keyset paging",
  inputSchema: {
    type: "object",
    properties: {
      adAccountId: { type: "string" },
      days: { type: "number" },
      from: { type: "string" },
      to: { type: "string" },
      status: { type: "string" },
      adSetId: { type: "string" },
      campaignId: { type: "string" },
      flag: { type: "string", enum: [...ADS_FLAGS] },
      format: { type: "string", enum: [...ADS_FORMATS] },
      q: { type: "string" },
      sort: { type: "string", enum: [...ADS_SORTS] },
      order: { type: "string", enum: [...ADS_ORDERS] },
      limit: { type: "number" },
      cursor: { type: "string" },
    },
    required: ["adAccountId"],
  },
  handler: async (ctx, args) => {
    const adAccountId = requireString(args, "adAccountId");
    const days = optionalNumber(args, "days");
    const limit = optionalNumber(args, "limit");
    const query: AdsListQuery = {
      ...(days === undefined ? {} : { days: String(days) }),
      ...optionalArgs(args, "from"),
      ...optionalArgs(args, "to"),
      ...optionalArgs(args, "status"),
      ...optionalArgs(args, "adSetId"),
      ...optionalArgs(args, "campaignId"),
      ...optionalArgs(args, "q"),
      ...optionalArgs(args, "cursor"),
      ...(limit === undefined ? {} : { limit: String(limit) }),
    };
    for (const [key, allowed] of Object.entries(ADS_ENUM_PARAMS)) {
      const value = optionalString(args, key);
      if (value === undefined) {
        continue;
      }
      if (!allowed.includes(value)) {
        throw invalidParams();
      }
      (query as Record<string, string | undefined>)[key] = value;
    }
    return ctx.models.adsList(adAccountId, query);
  },
};

export const metricsTools: McpTool[] = [getCampaigns, getAds, getAlerts];

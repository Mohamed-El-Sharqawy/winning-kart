import type { AlertListStatus } from "../alerts/model";
import {
  McpTool,
  clampInt,
  invalidParams,
  optionalNumber,
  optionalString,
  requireString,
} from "./tools";

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
    return ctx.models.adAccounts.campaignsWithMetrics(adAccountId, days);
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

export const metricsTools: McpTool[] = [getCampaigns, getAlerts];

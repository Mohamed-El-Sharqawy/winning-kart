import { round2 } from "../../platforms/meta";
import { utcWindow } from "../ad-accounts/service";
import { McpTool, requireString } from "./tools";

function emptyClientOverview() {
  return {
    spend: 0,
    revenue: 0,
    roas: null,
    cpa: null,
    purchases: 0,
    accountsHealthy: 0,
    accountsTotal: 0,
    issues: [],
    clients: [],
    insights: [],
  };
}

const CLIENT_SUMMARY = (row: {
  id: string;
  name: string;
  slug: string;
  status: string;
}) => ({ id: row.id, name: row.name, slug: row.slug, status: row.status });

const listClients: McpTool = {
  name: "list_clients",
  description: "List clients visible to the caller with name, slug, and status",
  inputSchema: { type: "object", properties: {} },
  handler: async (ctx) => {
    const rows = await ctx.models.clients.listClients();
    if (ctx.user.role !== "client") {
      return rows.map(CLIENT_SUMMARY);
    }
    const assigned = await ctx.models.ownership.findAssignedClient(ctx.user.id);
    return assigned === null ? [] : rows.filter((row) => row.id === assigned.id).map(CLIENT_SUMMARY);
  },
};

const listAdAccounts: McpTool = {
  name: "list_ad_accounts",
  description: "List a client's ad accounts with health, currency, and campaign count",
  inputSchema: {
    type: "object",
    properties: { clientId: { type: "string" } },
    required: ["clientId"],
  },
  handler: async (ctx, args) => {
    const clientId = requireString(args, "clientId");
    if (ctx.user.role === "client") {
      const ownClient = await ctx.models.ownership.findAssignedClient(ctx.user.id);
      if (ownClient === null || ownClient.id !== clientId) {
        return [];
      }
    }
    const rows = await ctx.models.adAccounts.listForClient(clientId);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      adAccountId: row.adAccountId,
      platform: row.platform,
      healthState: row.healthState,
      currency: row.currency,
      lastSyncAt: row.lastSyncAt,
      campaignCount: row.campaignCount,
    }));
  },
};

const getOverview: McpTool = {
  name: "get_overview",
  description: "Overview totals, account health, and client spend for the caller's scope",
  inputSchema: { type: "object", properties: {} },
  handler: async (ctx) => {
    if (ctx.user.role !== "client") {
      return ctx.models.overview.overview();
    }
    const client = await ctx.models.ownership.findAssignedClient(ctx.user.id);
    if (client === null) {
      return emptyClientOverview();
    }
    const accounts = await ctx.models.adAccounts.listForClient(client.id);
    const daily = await ctx.models.portal.accountDailySince(
      accounts.map((account) => account.id),
      utcWindow(30).since
    );
    const spend = round2(daily.reduce((sum, row) => sum + row.spend, 0));
    const revenue = round2(daily.reduce((sum, row) => sum + row.revenue, 0));
    const purchases = daily.reduce((sum, row) => sum + row.purchases, 0);
    const roas = spend > 0 ? round2(revenue / spend) : null;
    return {
      spend,
      revenue,
      roas,
      cpa: purchases > 0 ? round2(spend / purchases) : null,
      purchases,
      accountsHealthy: accounts.filter((account) => account.healthState === "healthy").length,
      accountsTotal: accounts.length,
      issues: accounts
        .filter((account) => account.healthState !== "healthy")
        .map((account) => ({
          adAccountId: account.id,
          name: account.name,
          healthState: account.healthState,
          lastSyncAt: account.lastSyncAt,
          errorHint: account.healthState,
        })),
      clients: [{ id: client.id, name: client.name, slug: client.slug, spend, revenue, roas }],
      insights: [],
    };
  },
};

export const readTools: McpTool[] = [listClients, listAdAccounts, getOverview];

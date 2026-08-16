import { round2 } from "../../platforms/meta";
import { utcWindow } from "../ad-accounts/service";
import type { TopInsightRow, UnhealthyAccount } from "./model";
import type { OverviewModel } from "./model";

export interface OverviewIssue {
  adAccountId: string;
  name: string;
  healthState: string;
  lastSyncAt: Date | null;
  errorHint: string;
}

export interface OverviewClientSpend {
  id: string;
  name: string;
  slug: string;
  spend: number;
  revenue: number;
  roas: number | null;
}

export interface OverviewPayload {
  spend: number;
  revenue: number;
  roas: number | null;
  cpa: number | null;
  purchases: number;
  accountsHealthy: number;
  accountsTotal: number;
  issues: OverviewIssue[];
  clients: OverviewClientSpend[];
  insights: TopInsightRow[];
}

const OVERVIEW_WINDOW_DAYS = 30;
const DAY_MS = 86400000;
const TOKEN_WARNING_DAYS = 7;

function tokenErrorHint(account: UnhealthyAccount): string | null {
  if (account.tokenType !== "user_60d" || account.tokenExpiresAt === null) {
    return null;
  }
  const remaining = account.tokenExpiresAt.getTime() - Date.now();
  if (remaining <= 0) {
    return "Token expired — reconnect";
  }
  const days = Math.ceil(remaining / DAY_MS);
  if (days <= TOKEN_WARNING_DAYS) {
    return `Token expires in ${days} day(s) — reconnect`;
  }
  return null;
}

export class OverviewService {
  constructor(private readonly model: OverviewModel) {}

  async overview(): Promise<OverviewPayload> {
    const since = utcWindow(OVERVIEW_WINDOW_DAYS).since;
    const [totals, counts, unhealthy, allClients, clientIdsWithAccounts, clientSpendRows, topInsights] =
      await Promise.all([
        this.model.accountTotalsSince(since),
        this.model.healthCounts(),
        this.model.unhealthyAccounts(),
        this.model.listClients(),
        this.model.clientIdsWithAccounts(),
        this.model.clientSpendSince(since),
        this.model.topInsights(),
      ]);
    const jobs = await this.model.latestJobsFor(unhealthy.map((account) => account.id));
    const latestJobByAccount = new Map<string, (typeof jobs)[number]>();
    for (const job of jobs) {
      if (!latestJobByAccount.has(job.adAccountId)) {
        latestJobByAccount.set(job.adAccountId, job);
      }
    }
    const issues: OverviewIssue[] = unhealthy.map((account) => {
      const job = latestJobByAccount.get(account.id);
      const tokenHint = tokenErrorHint(account);
      const errorHint =
        tokenHint !== null
          ? tokenHint
          : job && job.status === "failed"
            ? `${job.stage}: ${job.errorClass ?? "unknown"}`
            : account.healthState;
      return {
        adAccountId: account.id,
        name: account.name,
        healthState: account.healthState,
        lastSyncAt: account.lastSyncAt,
        errorHint,
      };
    });
    const spendByClient = new Map(clientSpendRows.map((row) => [row.clientId, row]));
    const clientRows: OverviewClientSpend[] = allClients
      .filter((client) => clientIdsWithAccounts.has(client.id))
      .map((client) => {
        const row = spendByClient.get(client.id);
        const spend = round2(row?.spend ?? 0);
        const revenue = round2(row?.revenue ?? 0);
        return {
          id: client.id,
          name: client.name,
          slug: client.slug,
          spend,
          revenue,
          roas: spend > 0 ? round2(revenue / spend) : null,
        };
      })
      .sort((a, b) => b.spend - a.spend);
    return {
      spend: round2(totals.spend),
      revenue: round2(totals.revenue),
      roas: totals.spend > 0 ? round2(totals.revenue / totals.spend) : null,
      cpa: totals.purchases > 0 ? round2(totals.spend / totals.purchases) : null,
      purchases: totals.purchases,
      accountsHealthy: counts.healthy,
      accountsTotal: counts.total,
      issues,
      clients: clientRows,
      insights: topInsights,
    };
  }
}

import { classifyAd } from "./fatigue";
import type { AdFatigueInput } from "./fatigue";

export type Severity = "critical" | "warning" | "info";

export type RuleKey =
  | "roas_drop"
  | "cpa_spike"
  | "spend_no_conversions"
  | "creative_fatigue"
  | "conversion_concentration"
  | "token_expiring"
  | "token_expired"
  | "account_restricted";

export const DATA_TRUST_RULES: readonly RuleKey[] = [
  "token_expiring",
  "token_expired",
  "account_restricted",
];

export const ROAS_DROP_MIN_SPEND_RECENT = 3500;
export const ROAS_DROP_TRIGGER_RATIO = 0.8;
export const ROAS_DROP_CRITICAL_DROP = 0.4;
export const ROAS_DROP_ATTRIBUTE_SHARE = 0.6;
export const CPA_SPIKE_MIN_PURCHASES_PRIOR = 5;
export const CPA_SPIKE_VOLUME_RATIO = 0.5;
export const CPA_SPIKE_TRIGGER_RATIO = 1.25;
export const CPA_SPIKE_CRITICAL_RATIO = 1.5;
export const ZERO_CONVERSION_MIN_SPEND = 500;
export const ZERO_CONVERSION_CRITICAL_SPEND = 1500;
export const ZERO_CONVERSION_MIN_AGE_DAYS = 7;
export const CONCENTRATION_PURCHASE_SHARE = 0.7;
export const CONCENTRATION_MIN_ADS = 3;
export const TOKEN_EXPIRY_WARNING_DAYS = 7;
export const RESTRICTED_ACCOUNT_STATUSES: readonly number[] = [2, 3, 7, 8];

const DAY_MS = 86400000;

export interface EntityWindow {
  level: "account" | "campaign";
  id: string;
  name: string | null;
  spendRecent: number;
  spendPrior: number;
  revenueRecent: number;
  revenuePrior: number;
  purchasesRecent: number;
  purchasesPrior: number;
  ctrRecent: number | null;
  ctrPrior: number | null;
}

export interface AccountSnapshot {
  id: string;
  clientId: string;
  name: string;
  tokenType: string;
  tokenExpiresAt: Date | null;
  accountStatusRaw: number | null;
}

export interface AdFatigueDatum {
  adId: string;
  adName: string;
  adSetId: string;
  spendRecent: number;
  input: AdFatigueInput;
}

export interface ClientAdPurchases {
  adId: string;
  adName: string | null;
  adAccountId: string;
  purchases: number;
}

export interface DetectionData {
  today: string;
  account: AccountSnapshot;
  windows: EntityWindow[];
  campaignFirstSeen: Map<string, string>;
  ads: AdFatigueDatum[];
  clientAdPurchases: ClientAdPurchases[];
  clientSpendRecent: number;
}

export interface AlertCandidate {
  ruleKey: RuleKey;
  dedupeKey: string;
  adAccountId: string;
  entityLevel: string;
  entityId: string;
  entityName: string | null;
  severity: Severity;
  whatHappened: string;
  headline: string;
  supportingMetrics: Record<string, unknown>;
  affectedSpend7d: number;
  dataTrust: boolean;
}

export interface InsightCandidate {
  insightType: string;
  dedupeKey: string;
  adAccountId: string;
  entityLevel: string;
  entityId: string;
  entityName: string | null;
  severity: Severity;
  headline: string;
  supportingMetrics: Record<string, unknown>;
  attributionStatus: "attributed" | "unattributed" | null;
  affectedSpend7d: number;
}

function money(value: number): string {
  return String(Math.round(value));
}

function ratio(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function percent(value: number): string {
  return String(Math.round(value * 10) / 10);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function windowRoas(window: EntityWindow, recent: boolean): number | null {
  const spend = recent ? window.spendRecent : window.spendPrior;
  const revenue = recent ? window.revenueRecent : window.revenuePrior;
  return spend > 0 ? revenue / spend : null;
}

function roasDropAlert(accountId: string, window: EntityWindow): AlertCandidate | null {
  const roasRecent = windowRoas(window, true);
  const roasPrior = windowRoas(window, false);
  if (roasRecent === null || roasPrior === null || roasPrior <= 0) {
    return null;
  }
  if (window.spendRecent < ROAS_DROP_MIN_SPEND_RECENT) {
    return null;
  }
  if (roasRecent > ROAS_DROP_TRIGGER_RATIO * roasPrior) {
    return null;
  }
  const drop = 1 - roasRecent / roasPrior;
  return {
    ruleKey: "roas_drop",
    dedupeKey: `roas_drop:${window.level}:${window.id}`,
    adAccountId: accountId,
    entityLevel: window.level,
    entityId: window.id,
    entityName: window.name,
    severity: drop >= ROAS_DROP_CRITICAL_DROP ? "critical" : "warning",
    whatHappened: `ROAS fell ${percent(drop * 100)}% (${ratio(roasPrior)}x → ${ratio(roasRecent)}x) over 7 days; ${money(window.spendRecent)} at risk`,
    headline: window.level === "account" ? "Account ROAS drop" : "Campaign ROAS drop",
    supportingMetrics: {
      roasPrior: round2(roasPrior),
      roasRecent: round2(roasRecent),
      dropPercent: round2(drop * 100),
      spendRecent: round2(window.spendRecent),
      spendPrior: round2(window.spendPrior),
      revenueRecent: round2(window.revenueRecent),
      revenuePrior: round2(window.revenuePrior),
    },
    affectedSpend7d: window.spendRecent,
    dataTrust: false,
  };
}

function roasDropInsight(
  account: EntityWindow,
  campaigns: EntityWindow[],
  severity: Severity
): InsightCandidate {
  const contributions = campaigns
    .map((window) => ({
      window,
      loss: Math.max(window.revenuePrior - window.revenueRecent, 0),
    }))
    .filter((entry) => entry.loss > 0)
    .sort((a, b) => b.loss - a.loss);
  const totalLoss = contributions.reduce((sum, entry) => sum + entry.loss, 0);
  const decomposition = contributions.slice(0, 3).map((entry) => ({
    campaignId: entry.window.id,
    campaignName: entry.window.name,
    revenueDelta: round2(entry.window.revenueRecent - entry.window.revenuePrior),
    lossShare: totalLoss > 0 ? round2((entry.loss / totalLoss) * 100) : 0,
    spendShare:
      account.spendRecent > 0
        ? round2((entry.window.spendRecent / account.spendRecent) * 100)
        : 0,
  }));
  const top = contributions[0];
  const attributed =
    top !== undefined && totalLoss > 0 && top.loss / totalLoss >= ROAS_DROP_ATTRIBUTE_SHARE;
  return {
    insightType: "roas_drop_cause",
    dedupeKey: `roas_drop_cause:account:${account.id}`,
    adAccountId: account.id,
    entityLevel: "account",
    entityId: account.id,
    entityName: account.name,
    severity,
    headline: attributed
      ? `Primary cause: ${top.window.name ?? top.window.id}`
      : "ROAS drop cause unattributed",
    supportingMetrics: {
      totalRevenueLoss: round2(totalLoss),
      decomposition,
    },
    attributionStatus: attributed ? "attributed" : "unattributed",
    affectedSpend7d: account.spendRecent,
  };
}

function cpaSpikeAlert(accountId: string, window: EntityWindow): AlertCandidate | null {
  if (window.purchasesPrior < CPA_SPIKE_MIN_PURCHASES_PRIOR) {
    return null;
  }
  if (window.purchasesRecent < CPA_SPIKE_VOLUME_RATIO * window.purchasesPrior) {
    return null;
  }
  if (window.purchasesRecent <= 0 || window.purchasesPrior <= 0) {
    return null;
  }
  const cpaRecent = window.spendRecent / window.purchasesRecent;
  const cpaPrior = window.spendPrior / window.purchasesPrior;
  if (cpaPrior <= 0 || cpaRecent < CPA_SPIKE_TRIGGER_RATIO * cpaPrior) {
    return null;
  }
  const spike = cpaRecent / cpaPrior;
  return {
    ruleKey: "cpa_spike",
    dedupeKey: `cpa_spike:campaign:${window.id}`,
    adAccountId: accountId,
    entityLevel: "campaign",
    entityId: window.id,
    entityName: window.name,
    severity: spike >= CPA_SPIKE_CRITICAL_RATIO ? "critical" : "warning",
    whatHappened: `CPA up ${percent((spike - 1) * 100)}% (${money(cpaPrior)} → ${money(cpaRecent)}) on steady volume`,
    headline: "Campaign CPA spike",
    supportingMetrics: {
      cpaPrior: round2(cpaPrior),
      cpaRecent: round2(cpaRecent),
      spikeRatio: round2(spike),
      purchasesPrior: window.purchasesPrior,
      purchasesRecent: window.purchasesRecent,
      spendRecent: round2(window.spendRecent),
      spendPrior: round2(window.spendPrior),
    },
    affectedSpend7d: window.spendRecent,
    dataTrust: false,
  };
}

function spendNoConversionsAlert(
  accountId: string,
  window: EntityWindow,
  firstSeen: string | undefined,
  today: string
): AlertCandidate | null {
  if (window.spendRecent < ZERO_CONVERSION_MIN_SPEND || window.purchasesRecent !== 0) {
    return null;
  }
  if (firstSeen === undefined) {
    return null;
  }
  const ageDays = (Date.parse(today) - Date.parse(firstSeen)) / DAY_MS;
  if (ageDays < ZERO_CONVERSION_MIN_AGE_DAYS) {
    return null;
  }
  return {
    ruleKey: "spend_no_conversions",
    dedupeKey: `spend_no_conversions:campaign:${window.id}`,
    adAccountId: accountId,
    entityLevel: "campaign",
    entityId: window.id,
    entityName: window.name,
    severity: window.spendRecent >= ZERO_CONVERSION_CRITICAL_SPEND ? "critical" : "warning",
    whatHappened: `${window.name ?? window.id} spent ${money(window.spendRecent)} with zero purchases in 7 days`,
    headline: "Spend with zero conversions",
    supportingMetrics: {
      spendRecent: round2(window.spendRecent),
      purchasesRecent: 0,
      firstSeen,
      ageDays: round2(ageDays),
    },
    affectedSpend7d: window.spendRecent,
    dataTrust: false,
  };
}

function creativeFatigueFindings(
  accountId: string,
  ads: AdFatigueDatum[]
): { alerts: AlertCandidate[]; insights: InsightCandidate[] } {
  const alerts: AlertCandidate[] = [];
  const insights: InsightCandidate[] = [];
  for (const ad of ads) {
    const finding = classifyAd(ad.input);
    if (finding === null) {
      continue;
    }
    if (finding.flag !== "fatiguing" && finding.flag !== "bleeding") {
      continue;
    }
    const severity: Severity = finding.flag === "bleeding" ? "critical" : "warning";
    const whatHappened =
      finding.flag === "bleeding"
        ? finding.reason
        : `Creative is fatiguing: ${finding.reason}`;
    const supportingMetrics = {
      adId: ad.adId,
      adName: ad.adName,
      adSetId: ad.adSetId,
      flag: finding.flag,
      reason: finding.reason,
      spendRecent: round2(ad.spendRecent),
      spendShare: ad.input.spendShare === null ? null : round2(ad.input.spendShare * 100),
      frequency: ad.input.frequency,
      roas: ad.input.roas,
    };
    alerts.push({
      ruleKey: "creative_fatigue",
      dedupeKey: `creative_fatigue:ad:${ad.adId}`,
      adAccountId: accountId,
      entityLevel: "ad",
      entityId: ad.adId,
      entityName: ad.adName,
      severity,
      whatHappened,
      headline: finding.flag === "bleeding" ? "Creative bleeding" : "Creative fatigue",
      supportingMetrics,
      affectedSpend7d: ad.spendRecent,
      dataTrust: false,
    });
    insights.push({
      insightType: "creative_fatigue",
      dedupeKey: `creative_fatigue:ad:${ad.adId}`,
      adAccountId: accountId,
      entityLevel: "ad",
      entityId: ad.adId,
      entityName: ad.adName,
      severity,
      headline: finding.flag === "bleeding" ? "Creative bleeding" : "Creative fatigue",
      supportingMetrics,
      attributionStatus: null,
      affectedSpend7d: ad.spendRecent,
    });
  }
  return { alerts, insights };
}

function concentrationAlert(data: DetectionData): AlertCandidate | null {
  const withPurchases = data.clientAdPurchases.filter((row) => row.purchases > 0);
  if (withPurchases.length < CONCENTRATION_MIN_ADS) {
    return null;
  }
  const total = data.clientAdPurchases.reduce((sum, row) => sum + row.purchases, 0);
  if (total <= 0) {
    return null;
  }
  const top = withPurchases.reduce((best, row) => (row.purchases > best.purchases ? row : best));
  const share = top.purchases / total;
  if (share < CONCENTRATION_PURCHASE_SHARE) {
    return null;
  }
  return {
    ruleKey: "conversion_concentration",
    dedupeKey: `conversion_concentration:client:${data.account.clientId}:ad:${top.adId}`,
    adAccountId: top.adAccountId,
    entityLevel: "account",
    entityId: top.adAccountId,
    entityName: top.adName,
    severity: "warning",
    whatHappened: `One ad drives ${percent(share * 100)}% of purchases — concentration risk`,
    headline: "Purchase concentration",
    supportingMetrics: {
      adId: top.adId,
      adName: top.adName,
      adPurchases: top.purchases,
      clientPurchases: total,
      purchaseShare: round2(share * 100),
      adsWithPurchases: withPurchases.length,
    },
    affectedSpend7d: data.clientSpendRecent,
    dataTrust: false,
  };
}

function tokenAlert(
  account: AccountSnapshot,
  accountSpendRecent: number
): AlertCandidate | null {
  if (account.tokenType !== "user_60d" || account.tokenExpiresAt === null) {
    return null;
  }
  const remainingMs = account.tokenExpiresAt.getTime() - Date.now();
  const expired = remainingMs <= 0;
  if (!expired && remainingMs > TOKEN_EXPIRY_WARNING_DAYS * DAY_MS) {
    return null;
  }
  const expiredAlert: AlertCandidate = {
    ruleKey: "token_expired",
    dedupeKey: `token_expired:${account.id}`,
    adAccountId: account.id,
    entityLevel: "account",
    entityId: account.id,
    entityName: account.name,
    severity: "critical",
    whatHappened: "Token expired — reconnect",
    headline: "Token expired",
    supportingMetrics: {
      tokenExpiresAt: account.tokenExpiresAt.toISOString(),
    },
    affectedSpend7d: accountSpendRecent,
    dataTrust: true,
  };
  if (expired) {
    return expiredAlert;
  }
  const days = Math.max(1, Math.ceil(remainingMs / DAY_MS));
  return {
    ruleKey: "token_expiring",
    dedupeKey: `token_expiring:${account.id}`,
    adAccountId: account.id,
    entityLevel: "account",
    entityId: account.id,
    entityName: account.name,
    severity: "warning",
    whatHappened: `Token expires in ${days} day(s) — reconnect`,
    headline: "Token expiring soon",
    supportingMetrics: {
      tokenExpiresAt: account.tokenExpiresAt.toISOString(),
      daysRemaining: days,
    },
    affectedSpend7d: accountSpendRecent,
    dataTrust: true,
  };
}

function restrictedAlert(
  account: AccountSnapshot,
  accountSpendRecent: number
): AlertCandidate | null {
  if (
    account.accountStatusRaw === null ||
    !RESTRICTED_ACCOUNT_STATUSES.includes(account.accountStatusRaw)
  ) {
    return null;
  }
  return {
    ruleKey: "account_restricted",
    dedupeKey: `account_restricted:${account.id}`,
    adAccountId: account.id,
    entityLevel: "account",
    entityId: account.id,
    entityName: account.name,
    severity: "critical",
    whatHappened: "Account restricted on Meta — ads may have stopped serving",
    headline: "Account restricted",
    supportingMetrics: {
      accountStatusRaw: account.accountStatusRaw,
    },
    affectedSpend7d: accountSpendRecent,
    dataTrust: true,
  };
}

export function evaluateDetection(data: DetectionData): {
  alerts: AlertCandidate[];
  insights: InsightCandidate[];
} {
  const accountId = data.account.id;
  const accountWindow = data.windows.find((row) => row.level === "account") ?? null;
  const campaignWindows = data.windows.filter((row) => row.level === "campaign");
  const alerts: AlertCandidate[] = [];
  const insights: InsightCandidate[] = [];
  for (const window of data.windows) {
    const candidate = roasDropAlert(accountId, window);
    if (candidate !== null) {
      alerts.push(candidate);
    }
  }
  const accountRoasAlert =
    accountWindow === null
      ? undefined
      : alerts.find((row) => row.ruleKey === "roas_drop" && row.entityLevel === "account");
  if (accountWindow !== null && accountRoasAlert !== undefined) {
    insights.push(roasDropInsight(accountWindow, campaignWindows, accountRoasAlert.severity));
  }
  for (const window of campaignWindows) {
    const cpa = cpaSpikeAlert(accountId, window);
    if (cpa !== null) {
      alerts.push(cpa);
    }
    const zero = spendNoConversionsAlert(
      accountId,
      window,
      data.campaignFirstSeen.get(window.id),
      data.today
    );
    if (zero !== null) {
      alerts.push(zero);
    }
  }
  const creative = creativeFatigueFindings(accountId, data.ads);
  alerts.push(...creative.alerts);
  insights.push(...creative.insights);
  const concentration = concentrationAlert(data);
  if (concentration !== null) {
    alerts.push(concentration);
  }
  const accountSpendRecent = accountWindow === null ? 0 : accountWindow.spendRecent;
  const token = tokenAlert(data.account, accountSpendRecent);
  if (token !== null) {
    alerts.push(token);
  }
  const restricted = restrictedAlert(data.account, accountSpendRecent);
  if (restricted !== null) {
    alerts.push(restricted);
  }
  return { alerts, insights };
}

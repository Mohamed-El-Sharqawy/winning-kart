export type MetaErrorClass =
  | "invalid_token"
  | "permission_denied"
  | "rate_limited"
  | "not_found"
  | "server_error"
  | "network_error";

export class MetaError extends Error {
  readonly errorClass: MetaErrorClass;
  readonly retryable: boolean;
  readonly status: number | null;

  constructor(errorClass: MetaErrorClass, message: string, status: number | null = null) {
    super(message);
    this.name = "MetaError";
    this.errorClass = errorClass;
    this.status = status;
    this.retryable = errorClass === "server_error" || errorClass === "network_error";
  }
}

export interface MetaActionMetric {
  action_type: string;
  value: string;
}

export interface MetaAccountInfo {
  id: string;
  name: string;
  currency: string;
  timezone_name: string;
  account_status?: number;
  amount_spent?: string;
  spend_cap?: string;
  balance?: string;
}

export interface MetaCampaignRow {
  id: string;
  name: string;
  status?: string;
  effective_status?: string;
  objective?: string;
  buying_type?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

export interface MetaAdSetRow {
  id: string;
  campaign_id: string;
  name: string;
  status?: string;
  effective_status?: string;
  optimization_goal?: string;
  bid_strategy?: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

export interface MetaAdCreativeRef {
  id: string;
  name?: string;
}

export interface MetaAdRow {
  id: string;
  adset_id: string;
  name: string;
  status?: string;
  effective_status?: string;
  creative?: MetaAdCreativeRef;
}

export interface MetaCreativeThumbnailRow {
  id?: string;
  thumbnail_url?: string;
  title?: string;
}

export type CreativeThumbnailMap = Record<string, MetaCreativeThumbnailRow>;

export interface MetaInsightRow {
  date_start: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  frequency?: string;
  actions?: MetaActionMetric[];
  action_values?: MetaActionMetric[];
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
}

export type InsightLevel = "account" | "campaign" | "adset" | "ad";

export interface TimeRange {
  since: string;
  until: string;
}

interface GraphErrorBody {
  error?: {
    message?: string;
    code?: number;
    error_subcode?: number;
  };
}

interface PagedBody<T> {
  data?: T[];
  paging?: {
    cursors?: { after?: string };
    next?: string;
  };
}

const REQUEST_TIMEOUT_MS = 30000;
const RETRY_DELAY_MS = 500;
const PAGE_LIMIT = 100;
const CREATIVE_IDS_LIMIT = 50;

function classifyGraphError(status: number, body: unknown): MetaError {
  const graphError = (body as GraphErrorBody | null)?.error;
  const code = typeof graphError?.code === "number" ? graphError.code : null;
  const message =
    typeof graphError?.message === "string" && graphError.message.length > 0
      ? graphError.message
      : `meta request failed with status ${status}`;
  if (code === 190 || code === 1023) {
    return new MetaError("invalid_token", message, status);
  }
  if (code === 200 || code === 10 || message.toLowerCase().includes("permission")) {
    return new MetaError("permission_denied", message, status);
  }
  if (code === 17 || status === 429) {
    return new MetaError("rate_limited", message, status);
  }
  if (code === 100 || code === 6122) {
    return new MetaError("not_found", message, status);
  }
  if (status >= 500) {
    return new MetaError("server_error", message, status);
  }
  if (status === 401) {
    return new MetaError("invalid_token", message, status);
  }
  return new MetaError("server_error", message, status);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MetaClient {
  readonly baseUrl = "https://graph.facebook.com/v21.0";

  constructor(private readonly token: string) {}

  async getAccountInfo(actId: string): Promise<MetaAccountInfo> {
    const body = await this.request(actId, {
      fields: "id,name,currency,timezone_name,account_status,amount_spent,spend_cap,balance",
    });
    return body as MetaAccountInfo;
  }

  getCampaigns(actId: string): Promise<MetaCampaignRow[]> {
    return this.requestAll(`${actId}/campaigns`, {
      fields:
        "id,name,status,effective_status,objective,buying_type,daily_budget,lifetime_budget,start_time,stop_time",
    });
  }

  getAdSets(actId: string): Promise<MetaAdSetRow[]> {
    return this.requestAll(`${actId}/adsets`, {
      fields:
        "id,campaign_id,name,status,effective_status,optimization_goal,bid_strategy,daily_budget,lifetime_budget",
    });
  }

  getAds(actId: string): Promise<MetaAdRow[]> {
    return this.requestAll(`${actId}/ads`, {
      fields: "id,adset_id,name,status,effective_status,creative{id,name}",
    });
  }

  async getCreativeThumbnails(ids: string[]): Promise<CreativeThumbnailMap> {
    if (ids.length === 0) {
      return {};
    }
    const capped = ids.slice(0, CREATIVE_IDS_LIMIT);
    const body = (await this.request("adcreatives", {
      ids: capped.join(","),
      fields: "thumbnail_url,title",
    })) as CreativeThumbnailMap | null;
    return body ?? {};
  }

  getInsights(actId: string, level: InsightLevel, timeRange: TimeRange): Promise<MetaInsightRow[]> {
    return this.requestAll(`${actId}/insights`, {
      level,
      fields: "spend,impressions,reach,clicks,ctr,cpc,cpm,frequency,actions,action_values",
      time_range: JSON.stringify({ since: timeRange.since, until: timeRange.until }),
      time_increment: "1",
    });
  }

  private async request(path: string, params: Record<string, string>): Promise<unknown> {
    try {
      return await this.rawRequest(path, params);
    } catch (error) {
      if (error instanceof MetaError && error.retryable) {
        await delay(RETRY_DELAY_MS);
        return this.rawRequest(path, params);
      }
      throw error;
    }
  }

  private async rawRequest(path: string, params: Record<string, string>): Promise<unknown> {
    const url = new URL(`${this.baseUrl}/${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    url.searchParams.set("access_token", this.token);
    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
      throw new MetaError(
        "network_error",
        error instanceof Error ? error.message : "network request failed"
      );
    }
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    if (!response.ok) {
      throw classifyGraphError(response.status, body);
    }
    return body;
  }

  private async requestAll<T>(path: string, params: Record<string, string>): Promise<T[]> {
    const rows: T[] = [];
    let after: string | undefined;
    for (;;) {
      const pageParams: Record<string, string> = { ...params, limit: String(PAGE_LIMIT) };
      if (after !== undefined) {
        pageParams.after = after;
      }
      const body = (await this.request(path, pageParams)) as PagedBody<T> | null;
      const data: T[] = body?.data ?? [];
      rows.push(...data);
      after = body?.paging?.cursors?.after;
      if (!body?.paging?.next || after === undefined || data.length === 0) {
        return rows;
      }
    }
  }
}

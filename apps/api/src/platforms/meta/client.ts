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

export interface MetaCreativeDetailRow {
  id?: string | null;
  name?: string | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  effective_object_store_url?: string | null;
  video_id?: string | null;
  video_source?: string | null;
  video_picture?: string | null;
  title?: string | null;
  body?: string | null;
  object_story_spec?: {
    video_data?: { video_id?: string | null; image_url?: string | null } | null;
  } | null;
  asset_feed_spec?: {
    videos?: Array<{ video_id?: string | null; thumbnail_url?: string | null }> | null;
  } | null;
  effective_object_story_id?: string | null;
  attachment_video_url?: string | null;
}

export function extractVideoId(row: MetaCreativeDetailRow): string | null {
  if (typeof row.video_id === "string" && row.video_id.length > 0) return row.video_id;
  const storyVideoId = row.object_story_spec?.video_data?.video_id;
  if (typeof storyVideoId === "string" && storyVideoId.length > 0) return storyVideoId;
  const feedVideo = row.asset_feed_spec?.videos?.find(
    (video) => typeof video.video_id === "string" && video.video_id.length > 0,
  );
  if (feedVideo !== undefined) return feedVideo.video_id as string;
  return null;
}

export type CreativeDetailMap = Record<string, MetaCreativeDetailRow>;

export interface MetaVideoRow {
  source?: string | null;
  picture?: string | null;
}

export type VideoDetailMap = Record<string, MetaVideoRow>;

export interface MetaStoryPostRow {
  attachments?: {
    data?: Array<{
      media_type?: string | null;
      url?: string | null;
      media?: { source?: string | null } | null;
    }>;
  } | null;
}

export type StoryPostMap = Record<string, MetaStoryPostRow>;

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
const VIDEO_IDS_BATCH_LIMIT = 50;

const BASE_INSIGHT_FIELDS =
  "spend,impressions,reach,clicks,ctr,cpc,cpm,frequency,actions,action_values";

const INSIGHT_LEVEL_ID_FIELDS: Record<InsightLevel, string | null> = {
  account: null,
  campaign: "campaign_id",
  adset: "adset_id",
  ad: "ad_id",
};

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

  async getCreativeDetails(actId: string): Promise<CreativeDetailMap> {
    const map: CreativeDetailMap = {};
    const rows = await this.requestAll(`${actId}/adcreatives`, {
      fields:
        "id,name,thumbnail_url,image_url,effective_object_store_url,video_id,title,body,object_story_spec{video_data{video_id,image_url}},asset_feed_spec{videos{video_id,thumbnail_url}},effective_object_story_id",
    });
    const videoIds = new Set<string>();
    const storyPostIds = new Set<string>();
    for (const row of rows as Array<MetaCreativeDetailRow>) {
      if (row && typeof row.id === "string") {
        map[row.id] = row;
        const videoId = extractVideoId(row);
        if (videoId !== null) {
          videoIds.add(videoId);
        } else if (typeof row.effective_object_story_id === "string" && row.effective_object_story_id.length > 0) {
          storyPostIds.add(row.effective_object_story_id);
        }
      }
    }
    if (videoIds.size > 0) {
      const videos = await this.getVideosByIds([...videoIds]);
      for (const row of Object.values(map)) {
        const videoId = extractVideoId(row);
        const video = videoId !== null ? videos[videoId] : undefined;
        if (video !== undefined) {
          row.video_source = video.source ?? null;
          row.video_picture = video.picture ?? null;
        }
      }
    }
    if (storyPostIds.size > 0) {
      const posts = await this.getStoryPostsByIds([...storyPostIds]);
      for (const row of Object.values(map)) {
        const postId = row.effective_object_story_id;
        const post = postId !== undefined && postId !== null ? posts[postId] : undefined;
        if (post === undefined) continue;
        const attachment = post.attachments?.data?.[0];
        if (attachment && attachment.media_type === "video") {
          row.attachment_video_url = attachment.url ?? attachment.media?.source ?? null;
        }
      }
    }
    return map;
  }

  private async getObjectsByIds<T>(ids: string[], fields: string): Promise<Record<string, T>> {
    const map: Record<string, T> = {};
    for (let offset = 0; offset < ids.length; offset += VIDEO_IDS_BATCH_LIMIT) {
      const batch = ids.slice(offset, offset + VIDEO_IDS_BATCH_LIMIT);
      try {
        const body = (await this.request("", {
          ids: batch.join(","),
          fields,
        })) as Record<string, unknown> | null;
        for (const [id, value] of Object.entries(body ?? {})) {
          if (value && typeof value === "object") {
            map[id] = value as T;
          }
        }
      } catch (error) {
        if (!(error instanceof MetaError) || !error.retryable) {
          continue;
        }
        throw error;
      }
    }
    return map;
  }

  private getVideosByIds(ids: string[]): Promise<VideoDetailMap> {
    return this.getObjectsByIds<MetaVideoRow>(ids, "source,picture");
  }

  private getStoryPostsByIds(ids: string[]): Promise<StoryPostMap> {
    return this.getObjectsByIds<MetaStoryPostRow>(ids, "attachments{media_type,type,url,media}");
  }

  getInsights(actId: string, level: InsightLevel, timeRange: TimeRange): Promise<MetaInsightRow[]> {
    const levelIdField = INSIGHT_LEVEL_ID_FIELDS[level];
    const fields =
      levelIdField === null ? BASE_INSIGHT_FIELDS : `${levelIdField},${BASE_INSIGHT_FIELDS}`;
    return this.requestAll(`${actId}/insights`, {
      level,
      fields,
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

import { mediaUrlTtlDays, anyMediaStale } from "../ad-accounts/media-freshness";
import { problem } from "../../lib/problem";
import { resolveWindow } from "../../lib/window";
import type { ResolvedWindow, WindowQuery } from "../../lib/window";
import { decorateAdsPage } from "./ads-decoration";
import type { AdItem, AdsRow } from "./ads-decoration";
import { trendWindows } from "./ads-list";
import type { PageRefresher } from "./ads-refresh";

export interface AdDetailDeps {
  findAccount(id: string): Promise<{ id: string; adAccountId: string } | undefined>;
  findAd(accountId: string, adId: string, window: ResolvedWindow): Promise<AdsRow | undefined>;
  refresher: PageRefresher;
}

export interface AdDetailItem extends AdItem {
  posterUrl: string | null;
  sourceUrl: string | null;
  adsManagerUrl: string;
}

export function adsManagerUrl(accountPlatformId: string, platformAdId: string): string {
  const act = accountPlatformId.replace(/^act_/, "");
  return `https://www.facebook.com/adsmanager/manage/campaigns?act=${act}&selected_ad_ids=${platformAdId}`;
}

export async function adDetail(
  deps: AdDetailDeps,
  accountId: string,
  adId: string,
  query: WindowQuery = {}
): Promise<AdDetailItem> {
  const account = await deps.findAccount(accountId);
  if (account === undefined) {
    throw problem(404, "RESOURCE_NOT_FOUND", `No ad account with id ${accountId}`);
  }
  const window = resolveWindow(query);
  const row = await deps.findAd(accountId, adId, window);
  if (row === undefined) {
    throw problem(404, "RESOURCE_NOT_FOUND", `No ad with id ${adId} in ad account ${accountId}`);
  }
  const now = new Date();
  const resolved = anyMediaStale(row, now, mediaUrlTtlDays())
    ? (await deps.refresher.resolve([row.id]))[0]
    : undefined;
  const [item] = decorateAdsPage([row]);
  return {
    ...item,
    thumbnailUrl: resolved?.thumbnailUrl ?? row.thumbnailUrl,
    posterUrl: resolved?.posterUrl ?? row.posterUrl,
    sourceUrl: resolved?.sourceUrl ?? row.sourceUrl,
    adsManagerUrl: adsManagerUrl(account.adAccountId, row.platformAdId),
  };
}

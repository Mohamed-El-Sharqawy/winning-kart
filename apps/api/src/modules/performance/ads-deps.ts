import { AdAccountsService } from "../ad-accounts/service";
import { AdAccountsModel } from "../ad-accounts/model";
import { PerformanceModel } from "./model";
import { AdsRepository } from "./ads-repository";
import { ListRepository } from "./list-repository";
import { ListSummaryRepository } from "./list-summaries";
import { trendWindows } from "./ads-list";
import type { AdsListDeps } from "./ads-list";
import type { AdDetailDeps } from "./ads-detail";
import type { ListsDeps } from "./list-service";

const performanceModel = new PerformanceModel();
const adsRepository = new AdsRepository();
const listRepository = new ListRepository();
const listSummaryRepository = new ListSummaryRepository();
const adAccounts = new AdAccountsService(new AdAccountsModel());

function baseDeps(accountId: string) {
  return {
    findAccount: (id: string) => performanceModel.findAccount(id),
    refresher: { resolve: (ids: string[]) => adAccounts.resolveMedia(accountId, ids, false) },
  };
}

export function adsListDeps(accountId: string): AdsListDeps {
  return {
    ...baseDeps(accountId),
    pageAds: (input) => adsRepository.pageAds(input),
  };
}

export function adDetailDeps(accountId: string): AdDetailDeps {
  return {
    ...baseDeps(accountId),
    findAd: (id, adId, window) =>
      adsRepository.findAd({
        accountId: id,
        adId,
        since: window.since,
        until: window.until,
        ...trendWindows(window),
      }),
  };
}

export function listDeps(): ListsDeps {
  return {
    findAccount: (id) => performanceModel.findAccount(id),
    pageCampaigns: (input) => listRepository.pageCampaigns(input),
    pageAdSets: (input) => listRepository.pageAdSets(input),
    campaignSummary: (input) => listSummaryRepository.campaignSummary(input),
    adSetSummary: (input) => listSummaryRepository.adSetSummary(input),
  };
}

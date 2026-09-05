import { AdAccountsService } from "../ad-accounts/service";
import { AdAccountsModel } from "../ad-accounts/model";
import { PerformanceModel } from "./model";
import { AdsRepository } from "./ads-repository";
import type { AdsListDeps } from "./ads-list";

const performanceModel = new PerformanceModel();
const adsRepository = new AdsRepository();
const adAccounts = new AdAccountsService(new AdAccountsModel());

export function adsListDeps(accountId: string): AdsListDeps {
  return {
    findAccount: (id) => performanceModel.findAccount(id),
    pageAds: (input) => adsRepository.pageAds(input),
    refresher: { resolve: (ids) => adAccounts.resolveMedia(accountId, ids, false) },
  };
}

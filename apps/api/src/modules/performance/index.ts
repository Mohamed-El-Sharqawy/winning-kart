import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import {
  fatigueSummaryDto,
  fatigueSummaryQueryDto,
  performanceCampaignDto,
  performanceWindowQueryDto,
} from "../../dto/performance";
import {
  adSetsListQueryDto,
  adSetsPageDto,
  adSetsSummaryQueryDto,
  campaignsListQueryDto,
  campaignsPageDto,
  campaignsSummaryQueryDto,
  kpiSummaryDto,
} from "../../dto/list-pages";
import { adsListPageDto, adsListQueryDto, adDetailDto } from "../../dto/ads-list";
import { mediaResolveBodyDto, mediaResolveResponseDto } from "../../dto/media";
import { toMediaResolveItem } from "../ad-accounts/media-resolver";
import { AdAccountsService } from "../ad-accounts/service";
import { AdAccountsModel } from "../ad-accounts/model";
import { ClientOwnershipModel } from "../portal/client-ownership";
import { requireAdAccountAccess } from "../portal/access";
import { campaignDetail } from "./campaign-detail";
import { fatigueSummary } from "./fatigue-summary";
import { listAdsPage } from "./ads-list";
import { adDetail } from "./ads-detail";
import { adsListDeps, adDetailDeps, campaignDetailDeps, fatigueSummaryDeps, listDeps } from "./ads-deps";
import { adSetsPage, adSetsSummary, campaignsPage, campaignsSummary } from "./list-service";
import type { SafeUser } from "../auth/model";

const adAccounts = new AdAccountsService(new AdAccountsModel());
const ownership = new ClientOwnershipModel();

async function requireUser(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    throw problem(401, "UNAUTHENTICATED", "Authentication required");
  }
  return user;
}

async function requireAdAccountRead(
  headers: Record<string, string | undefined>,
  accountId: string
): Promise<SafeUser> {
  const user = await requireUser(headers);
  await requireAdAccountAccess(user, ownership, accountId);
  return user;
}

const idParamsDto = t.Object({ id: t.String() });
const adParamsDto = t.Object({ id: t.String(), adId: t.String() });
const campaignParamsDto = t.Object({ id: t.String(), campaignId: t.String() });

export const performanceModule = new Elysia({ prefix: "/ad-accounts" })
  .get(
    "/:id/campaigns/summary",
    async ({ params, query, headers }) => {
      await requireAdAccountRead(headers, params.id);
      return { data: await campaignsSummary(listDeps(), params.id, query) };
    },
    { params: idParamsDto, query: campaignsSummaryQueryDto, response: { 200: kpiSummaryDto } }
  )
  .get(
    "/:id/ad-sets/summary",
    async ({ params, query, headers }) => {
      await requireAdAccountRead(headers, params.id);
      return { data: await adSetsSummary(listDeps(), params.id, query) };
    },
    { params: idParamsDto, query: adSetsSummaryQueryDto, response: { 200: kpiSummaryDto } }
  )
  .get(
    "/:id/campaigns",
    async ({ params, query, headers }) => {
      await requireAdAccountRead(headers, params.id);
      return await campaignsPage(listDeps(), params.id, query);
    },
    { params: idParamsDto, query: campaignsListQueryDto, response: { 200: campaignsPageDto } }
  )
  .get(
    "/:id/ad-sets",
    async ({ params, query, headers }) => {
      await requireAdAccountRead(headers, params.id);
      return await adSetsPage(listDeps(), params.id, query);
    },
    { params: idParamsDto, query: adSetsListQueryDto, response: { 200: adSetsPageDto } }
  )
  .get(
    "/:id/ads",
    async ({ params, query, headers }) => {
      await requireAdAccountRead(headers, params.id);
      return await listAdsPage(adsListDeps(params.id), params.id, query);
    },
    { params: idParamsDto, query: adsListQueryDto, response: { 200: adsListPageDto } }
  )
  .get(
    "/:id/ads/:adId",
    async ({ params, query, headers }) => {
      await requireAdAccountRead(headers, params.id);
      return { data: await adDetail(adDetailDeps(params.id), params.id, params.adId, query) };
    },
    { params: adParamsDto, query: performanceWindowQueryDto, response: { 200: adDetailDto } }
  )
  .post(
    "/:id/ads/media/resolve",
    async ({ params, body, headers }) => {
      const user = await requireAdAccountRead(headers, params.id);
      const force = user.role === "client" ? false : (body.force ?? false);
      const items = await adAccounts.resolveMedia(params.id, body.ids, force);
      return { data: { items: items.map(toMediaResolveItem) } };
    },
    { params: idParamsDto, body: mediaResolveBodyDto, response: { 200: mediaResolveResponseDto } }
  )
  .get(
    "/:id/campaigns/:campaignId",
    async ({ params, query, headers }) => {
      await requireAdAccountRead(headers, params.id);
      return {
        data: await campaignDetail(campaignDetailDeps(params.id), params.id, params.campaignId, query),
      };
    },
    { params: campaignParamsDto, query: performanceWindowQueryDto, response: { 200: performanceCampaignDto } }
  )
  .get(
    "/:id/fatigue-summary",
    async ({ params, query, headers }) => {
      await requireAdAccountRead(headers, params.id);
      return { data: await fatigueSummary(fatigueSummaryDeps(), params.id, query) };
    },
    { params: idParamsDto, query: fatigueSummaryQueryDto, response: { 200: fatigueSummaryDto } }
  );

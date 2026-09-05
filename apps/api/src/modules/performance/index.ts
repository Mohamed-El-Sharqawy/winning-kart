import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import {
  fatigueSummaryDto,
  performanceAdSetsDto,
  performanceAdsDto,
  performanceAdsQueryDto,
  performanceCampaignDto,
  performanceWindowQueryDto,
} from "../../dto/performance";
import { mediaResolveBodyDto, mediaResolveResponseDto } from "../../dto/media";
import { resolveWindow } from "../../lib/window";
import { AdAccountsService } from "../ad-accounts/service";
import { AdAccountsModel } from "../ad-accounts/model";
import { PerformanceModel } from "./model";
import { PerformanceService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new PerformanceService(new PerformanceModel());
const adAccounts = new AdAccountsService(new AdAccountsModel());

async function requireUser(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    throw problem(401, "UNAUTHENTICATED", "Authentication required");
  }
  return user;
}

async function requireAgency(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await requireUser(headers);
  if (user.role === "client") {
    throw problem(403, "FORBIDDEN", "Agency role required");
  }
  return user;
}

const idParamsDto = t.Object({ id: t.String() });
const campaignParamsDto = t.Object({ id: t.String(), campaignId: t.String() });

export const performanceModule = new Elysia({ prefix: "/ad-accounts" })
  .get(
    "/:id/ad-sets",
    async ({ params, query, headers }) => {
      await requireAgency(headers);
      return { data: await service.listAdSets(params.id, resolveWindow(query)) };
    },
    { params: idParamsDto, query: performanceWindowQueryDto, response: { 200: performanceAdSetsDto } }
  )
  .get(
    "/:id/ads",
    async ({ params, query, headers }) => {
      await requireAgency(headers);
      return { data: await service.listAds(params.id, resolveWindow(query), query.adSetId) };
    },
    { params: idParamsDto, query: performanceAdsQueryDto, response: { 200: performanceAdsDto } }
  )
  .post(
    "/:id/ads/media/resolve",
    async ({ params, body, headers }) => {
      await requireAgency(headers);
      return {
        data: { items: await adAccounts.resolveMedia(params.id, body.ids, body.force ?? false) },
      };
    },
    { params: idParamsDto, body: mediaResolveBodyDto, response: { 200: mediaResolveResponseDto } }
  )
  .get(
    "/:id/campaigns/:campaignId",
    async ({ params, query, headers }) => {
      await requireAgency(headers);
      return {
        data: await service.campaignDetail(params.id, params.campaignId, resolveWindow(query)),
      };
    },
    { params: campaignParamsDto, query: performanceWindowQueryDto, response: { 200: performanceCampaignDto } }
  )
  .get(
    "/:id/fatigue-summary",
    async ({ params, query, headers }) => {
      await requireAgency(headers);
      return { data: await service.fatigueSummary(params.id, resolveWindow(query)) };
    },
    { params: idParamsDto, query: performanceWindowQueryDto, response: { 200: fatigueSummaryDto } }
  );

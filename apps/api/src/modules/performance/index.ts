import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import {
  fatigueSummaryDto,
  performanceAdSetsDto,
  performanceAdsDto,
  performanceAdsQueryDto,
  performanceCampaignDto,
} from "../../dto/performance";
import { PerformanceModel } from "./model";
import { PerformanceService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new PerformanceService(new PerformanceModel());

async function requireUser(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    throw problem(401, "UNAUTHENTICATED", "Authentication required");
  }
  return user;
}

const idParamsDto = t.Object({ id: t.String() });
const campaignParamsDto = t.Object({ id: t.String(), campaignId: t.String() });
const daysQueryDto = t.Object({ days: t.Optional(t.String({ pattern: "^[0-9]+$" })) });

function parseDays(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "30", 10);
  if (!Number.isFinite(parsed)) {
    return 30;
  }
  return Math.min(Math.max(parsed, 1), 90);
}

export const performanceModule = new Elysia({ prefix: "/ad-accounts" })
  .get(
    "/:id/ad-sets",
    async ({ params, query, headers }) => {
      await requireUser(headers);
      return { data: await service.listAdSets(params.id, parseDays(query.days)) };
    },
    { params: idParamsDto, query: daysQueryDto, response: { 200: performanceAdSetsDto } }
  )
  .get(
    "/:id/ads",
    async ({ params, query, headers }) => {
      await requireUser(headers);
      return { data: await service.listAds(params.id, parseDays(query.days), query.adSetId) };
    },
    { params: idParamsDto, query: performanceAdsQueryDto, response: { 200: performanceAdsDto } }
  )
  .get(
    "/:id/campaigns/:campaignId",
    async ({ params, query, headers }) => {
      await requireUser(headers);
      return {
        data: await service.campaignDetail(params.id, params.campaignId, parseDays(query.days)),
      };
    },
    { params: campaignParamsDto, query: daysQueryDto, response: { 200: performanceCampaignDto } }
  )
  .get(
    "/:id/fatigue-summary",
    async ({ params, query, headers }) => {
      await requireUser(headers);
      return { data: await service.fatigueSummary(params.id, parseDays(query.days)) };
    },
    { params: idParamsDto, query: daysQueryDto, response: { 200: fatigueSummaryDto } }
  );

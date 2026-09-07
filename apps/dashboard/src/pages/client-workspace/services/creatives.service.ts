import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { looseApi } from "@/shared/lib/loose-api";
import type { DateRange } from "@/shared/components/DateRangeControl";
import type { SortDirection } from "../components/SortHeader";
import type { FatigueSummaryDto, GalleryAdDetailDto, GalleryPageDto, MediaResolveResponseDto } from "../dto/creatives.dto";
import { toFatigueSummary, toGalleryAdDetail, toGalleryPage, toRepairedMedia } from "../transformers/creatives.transformer";
import type { AdFormat, FatigueFlag, GalleryAdDetail, GalleryPage, GallerySortKey, RepairedMedia, StatusFilter } from "../types/creatives.types";

export interface GalleryFilters {
  status: StatusFilter;
  flag: FatigueFlag | "all";
  format: "all" | AdFormat;
  q: string;
  sort: GallerySortKey;
  order: SortDirection;
  adSetId?: string;
}

function windowQuery(range: DateRange, rangeExplicit: boolean): Record<string, string | number> {
  return rangeExplicit ? { from: range.from, to: range.to } : { days: 30 };
}

export function adsQueryParams(
  range: DateRange,
  rangeExplicit: boolean,
  filters: GalleryFilters,
  cursor?: string | null,
): Record<string, string | number> {
  const query = windowQuery(range, rangeExplicit);
  query.status = filters.status;
  if (filters.adSetId !== undefined) query.adSetId = filters.adSetId;
  if (filters.flag !== "all") query.flag = filters.flag;
  if (filters.format !== "all") query.format = filters.format;
  if (filters.q.trim() !== "") query.q = filters.q.trim();
  query.sort = filters.sort;
  query.order = filters.order;
  if (cursor !== null && cursor !== undefined && cursor !== "") query.cursor = cursor;
  return query;
}

export function useAds(accountId: string | null, range: DateRange, rangeExplicit: boolean, filters: GalleryFilters) {
  return useInfiniteQuery({
    queryKey: ["ad-accounts", accountId, "ads", range.from, range.to, rangeExplicit, filters],
    enabled: accountId !== null,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<GalleryPage> => {
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string }).ads.get({
        query: adsQueryParams(range, rangeExplicit, filters, pageParam),
      });
      if (error) throw new Error("Failed to load creatives");
      return toGalleryPage(body as GalleryPageDto);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useAdDetail(
  accountId: string | null,
  adId: string | null,
  range: DateRange,
  rangeExplicit: boolean,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["ad-accounts", accountId, "ads", adId, "detail", range.from, range.to, rangeExplicit],
    enabled: enabled && accountId !== null && adId !== null,
    queryFn: async (): Promise<GalleryAdDetail> => {
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string }).ads[
        adId as string
      ].get({ query: windowQuery(range, rangeExplicit) });
      if (error) throw new Error("Failed to load the creative");
      const payload = (body as { data: GalleryAdDetailDto }).data;
      return toGalleryAdDetail(payload);
    },
  });
}

export function useMediaRepair(accountId: string | null) {
  return useMutation({
    mutationFn: async (ids: string[]): Promise<RepairedMedia[]> => {
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string }).ads.media.resolve.post({
        ids,
        force: true,
      });
      if (error) throw new Error("Failed to repair media");
      return ((body as MediaResolveResponseDto).data.items ?? []).map(toRepairedMedia);
    },
  });
}

export type FatigueScope = Pick<GalleryFilters, "status" | "adSetId" | "format" | "q">;

export function useFatigueSummary(
  accountId: string | null,
  range: DateRange,
  rangeExplicit: boolean,
  scope: FatigueScope,
) {
  return useQuery({
    queryKey: ["ad-accounts", accountId, "fatigue-summary", range.from, range.to, rangeExplicit, scope],
    enabled: accountId !== null,
    queryFn: async (): Promise<ReturnType<typeof toFatigueSummary>> => {
      const query: Record<string, string | number> = windowQuery(range, rangeExplicit);
      query.status = scope.status;
      if (scope.adSetId !== undefined) query.adSetId = scope.adSetId;
      if (scope.format !== "all") query.format = scope.format;
      if (scope.q.trim() !== "") query.q = scope.q.trim();
      const { data: body, error } = await looseApi["ad-accounts"]({ id: accountId as string })[
        "fatigue-summary"
      ].get({ query });
      if (error) throw new Error("Failed to load fatigue summary");
      const payload = (body as { data: FatigueSummaryDto }).data;
      return toFatigueSummary(payload);
    },
  });
}

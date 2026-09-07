import { useMemo, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { useDebounce } from "@/shared/hooks/useDebounce";
import type { DateRange } from "@/shared/components/DateRangeControl";
import { EmptyState } from "@/shared/components/EmptyState";
import { statusFilterLabel } from "../data/gallery-copy.data";
import { useAds, useFatigueSummary, type GalleryFilters } from "../services/creatives.service";
import { useCreativeDrawerUrl } from "../services/use-creative-drawer-url";
import { useCreativesScope } from "../services/use-creatives-scope";
import { useGalleryRepair } from "../services/use-gallery-repair";
import { useGalleryRows } from "../services/use-gallery-rows";
import { useSentinel } from "../services/use-sentinel";
import type { AdFormat, FatigueFlag, GallerySortKey, StatusFilter } from "../types/creatives.types";
import { GalleryPrototype } from "../prototype/GalleryPrototype";
import { CreativeDrawer } from "./CreativeDrawer";
import { GalleryTable } from "./GalleryTable";
import { GallerySummary } from "./GallerySummary";
import { GalleryToolbar } from "./GalleryToolbar";
import { SkeletonRows } from "./SkeletonRows";
import { nextSortState } from "./SortHeader";
import type { SortState } from "./SortHeader";

export interface CreativesTabProps {
  accountId: string | null;
  range: DateRange;
  rangeExplicit: boolean;
  clientSlug: string;
}

export function CreativesTab({ accountId, range, rangeExplicit, clientSlug }: CreativesTabProps) {
  const [status, setStatus] = useState<StatusFilter>("active");
  const [flagFilter, setFlagFilter] = useState<FatigueFlag | "all">("all");
  const [formatFilter, setFormatFilter] = useState<"all" | AdFormat>("all");
  const [searchInput, setSearchInput] = useState("");
  const q = useDebounce(searchInput, 300);
  const [sort, setSort] = useState<SortState>({ key: "spend", direction: "desc" });
  const { thumbOverrides, repairThumbnail } = useGalleryRepair(accountId);
  const { variant, creative } = useSearch({ from: "/clients/$slug" });
  const {
    adSet,
    adSetName,
    campaign,
    campaignName,
    clearAdSetFilter,
    clearCampaignFilter,
    campaignBackTo,
  } = useCreativesScope(clientSlug);
  const { openCreative, closeCreative } = useCreativeDrawerUrl(clientSlug);

  const filters = useMemo<GalleryFilters>(
    () => ({
      status,
      flag: flagFilter,
      format: formatFilter,
      q,
      sort: sort.key as GallerySortKey,
      order: sort.direction,
      adSetId: adSet === undefined ? undefined : adSet,
      campaignId: campaign === undefined ? undefined : campaign,
    }),
    [status, flagFilter, formatFilter, q, sort, adSet, campaign],
  );
  const ads = useAds(accountId, range, rangeExplicit, filters);
  const summary = useFatigueSummary(accountId, range, rangeExplicit, {
    status,
    adSetId: adSet === undefined ? undefined : adSet,
    campaignId: campaign === undefined ? undefined : campaign,
    format: formatFilter,
    q,
  });
  const rows = useGalleryRows(ads, thumbOverrides);

  const sentinelRef = useSentinel(
    () => {
      if (ads.hasNextPage && !ads.isFetchingNextPage) void ads.fetchNextPage();
    },
    rows.length > 0 && Boolean(ads.hasNextPage),
    rows.length,
  );

  if (variant !== undefined) return <GalleryPrototype variant={variant} />;

  const drawer =
    creative !== undefined ? (
      <CreativeDrawer
        accountId={accountId}
        adId={creative}
        range={range}
        rangeExplicit={rangeExplicit}
        onClose={closeCreative}
      />
    ) : null;

  return (
    <div className="flex flex-col gap-4">
      {ads.isPending ? (
        <SkeletonRows rows={8} columns={7} />
      ) : (
        <>
          {summary.data ? <GallerySummary summary={summary.data} /> : null}
          <GalleryToolbar
            adSet={adSet}
            adSetName={adSetName}
            onClearAdSet={clearAdSetFilter}
            campaign={campaign}
            campaignName={campaignName}
            onClearCampaign={clearCampaignFilter}
            campaignBackTo={campaignBackTo}
            status={status}
            onStatus={setStatus}
            flagFilter={flagFilter}
            onFlagFilter={setFlagFilter}
            formatFilter={formatFilter}
            onFormatFilter={setFormatFilter}
            searchInput={searchInput}
            onSearchInput={setSearchInput}
            rowCount={rows.length}
          />
          {rows.length === 0 ? (
            status === "all" ? (
              <EmptyState title="No creatives yet — sync the ad account" />
            ) : (
              <EmptyState
                title={`No ${statusFilterLabel(status).toLowerCase()} creatives in this scope`}
                hint="Switch the status filter to widen the scope."
              />
            )
          ) : (
            <>
              <GalleryTable
                rows={rows}
                sort={sort}
                onSort={(key) => setSort((current) => nextSortState(current, key, "desc"))}
                onOpen={openCreative}
                onImageError={repairThumbnail}
              />
              <div ref={sentinelRef} data-testid="gallery-sentinel" className="h-2" />
              {ads.isFetchingNextPage ? <p className="text-center text-[13px] text-volt-text-3">Loading more…</p> : null}
              {!ads.hasNextPage && rows.length > 0 ? (
                <p className="text-center text-[13px] text-volt-text-3">End of results</p>
              ) : null}
            </>
          )}
        </>
      )}
      {drawer}
    </div>
  );
}

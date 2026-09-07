import { useNavigate, useSearch } from "@tanstack/react-router";
import type { CampaignDetailSearch } from "@/routes/router";

export function useCreativesScope(clientSlug: string) {
  const search = useSearch({ from: "/clients/$slug" });
  const navigate = useNavigate();
  const { adSet, adSetName, campaign, campaignName, days, from, to, account, accountName } = search;

  function clearAdSetFilter() {
    void navigate({
      to: "/clients/$slug",
      params: { slug: clientSlug },
      search: (prev) => ({ ...prev, tab: "creatives", adSet: undefined, adSetName: undefined }),
    });
  }

  function clearCampaignFilter() {
    void navigate({
      to: "/clients/$slug",
      params: { slug: clientSlug },
      search: (prev) => ({
        ...prev,
        tab: "creatives",
        campaign: undefined,
        campaignName: undefined,
      }),
    });
  }

  const campaignBackTo: CampaignDetailSearchLocation | null =
    campaign === undefined
      ? null
      : {
          slug: clientSlug,
          campaignId: campaign,
          search: { days: days ?? 30, from, to, account, accountName },
        };

  return {
    adSet,
    adSetName,
    campaign,
    campaignName,
    clearAdSetFilter,
    clearCampaignFilter,
    campaignBackTo,
  };
}

interface CampaignDetailSearchLocation {
  slug: string;
  campaignId: string;
  search: CampaignDetailSearch;
}

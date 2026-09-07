import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";

export function useCreativeDrawerUrl(slug: string, campaignId: string) {
  const navigate = useNavigate();
  const openedInApp = useRef(false);

  function openCreative(adId: string) {
    openedInApp.current = true;
    void navigate({
      to: "/clients/$slug/campaigns/$campaignId",
      params: { slug, campaignId },
      search: (prev) => ({
        days: prev.days ?? 30,
        from: prev.from,
        to: prev.to,
        account: prev.account,
        accountName: prev.accountName,
        creative: adId,
      }),
    });
  }

  function closeCreative() {
    if (openedInApp.current) {
      window.history.back();
      return;
    }
    void navigate({
      to: "/clients/$slug/campaigns/$campaignId",
      params: { slug, campaignId },
      search: (prev) => ({
        days: prev.days ?? 30,
        from: prev.from,
        to: prev.to,
        account: prev.account,
        accountName: prev.accountName,
        creative: undefined,
      }),
      replace: true,
    });
  }

  return { openCreative, closeCreative };
}

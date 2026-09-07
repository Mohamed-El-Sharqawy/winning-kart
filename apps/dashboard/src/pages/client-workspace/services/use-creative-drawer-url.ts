import { useRef } from "react";
import { useNavigate } from "@tanstack/react-router";

export function useCreativeDrawerUrl(clientSlug: string) {
  const navigate = useNavigate();
  const openedInApp = useRef(false);

  function openCreative(adId: string) {
    openedInApp.current = true;
    void navigate({
      to: "/clients/$slug",
      params: { slug: clientSlug },
      search: (prev) => ({ ...prev, tab: "creatives", creative: adId }),
    });
  }

  function closeCreative() {
    if (openedInApp.current) {
      window.history.back();
      return;
    }
    void navigate({
      to: "/clients/$slug",
      params: { slug: clientSlug },
      search: (prev) => ({ ...prev, tab: "creatives", creative: undefined }),
      replace: true,
    });
  }

  return { openCreative, closeCreative };
}

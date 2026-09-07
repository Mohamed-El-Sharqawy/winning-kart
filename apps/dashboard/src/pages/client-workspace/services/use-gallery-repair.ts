import { useRef, useState } from "react";
import { useMediaRepair } from "./creatives.service";

export function useGalleryRepair(accountId: string | null) {
  const [thumbOverrides, setThumbOverrides] = useState<Record<string, string>>({});
  const attempts = useRef(new Set<string>());
  const repair = useMediaRepair(accountId);

  function repairThumbnail(adId: string, failedSrc: string | null) {
    const attemptKey = `${adId}:${failedSrc ?? ""}`;
    if (attempts.current.has(attemptKey)) return;
    attempts.current.add(attemptKey);
    repair.mutate([adId], {
      onError: () => attempts.current.delete(attemptKey),
      onSuccess: (items) => {
        setThumbOverrides((prev) => {
          const next = { ...prev };
          for (const item of items) {
            if (item.thumbnailUrl !== null) next[item.adId] = item.thumbnailUrl;
          }
          return next;
        });
      },
    });
  }

  return { thumbOverrides, repairThumbnail };
}

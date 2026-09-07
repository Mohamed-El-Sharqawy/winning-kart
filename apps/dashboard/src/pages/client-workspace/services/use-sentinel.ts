import { useEffect, useRef } from "react";

export function useSentinel(fetchMore: () => void, active: boolean, resetKey: string | number = 0) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fetchMoreRef = useRef(fetchMore);

  useEffect(() => {
    fetchMoreRef.current = fetchMore;
  }, [fetchMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!active || node === null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchMoreRef.current();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active, resetKey]);

  return sentinelRef;
}

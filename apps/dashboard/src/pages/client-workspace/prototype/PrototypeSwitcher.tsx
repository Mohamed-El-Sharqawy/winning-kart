import { useEffect } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";

export const PROTOTYPE_VARIANTS = [
  { key: "A", name: "Ads Manager grid" },
  { key: "B", name: "Media table + drawer" },
  { key: "C", name: "Ad library masonry" },
];

export function PrototypeSwitcher({ current }: { current: string }) {
  const { slug } = useParams({ from: "/clients/$slug" });
  const navigate = useNavigate();
  const { variant } = useSearch({ from: "/clients/$slug" });

  function go(delta: number) {
    const index = Math.max(0, PROTOTYPE_VARIANTS.findIndex((candidate) => candidate.key === (variant ?? "A")));
    const next = PROTOTYPE_VARIANTS[(index + delta + PROTOTYPE_VARIANTS.length) % PROTOTYPE_VARIANTS.length];
    void navigate({
      to: "/clients/$slug",
      params: { slug },
      search: (prev) => ({ ...prev, tab: "creatives" as const, variant: next.key }),
    });
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target !== null && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const active = PROTOTYPE_VARIANTS.find((candidate) => candidate.key === current);
  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-volt-border-2 bg-volt-surface px-4 py-2 shadow-lg">
      <button
        type="button"
        onClick={() => go(-1)}
        className="rounded-full border border-volt-border px-3 py-1 text-xs text-volt-text-2 hover:text-volt-text"
      >
        Prev
      </button>
      <span className="text-[13px] font-medium whitespace-nowrap text-volt-text">
        {current} — {active?.name ?? "unknown"}
      </span>
      <button
        type="button"
        onClick={() => go(1)}
        className="rounded-full border border-volt-border px-3 py-1 text-xs text-volt-text-2 hover:text-volt-text"
      >
        Next
      </button>
      <span className="text-[11px] text-volt-text-3">prototype</span>
    </div>
  );
}

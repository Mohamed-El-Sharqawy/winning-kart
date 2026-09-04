import { PrototypeSwitcher } from "./PrototypeSwitcher";
import { VariantGrid } from "./VariantGrid";
import { VariantMasonry } from "./VariantMasonry";
import { VariantTable } from "./VariantTable";

export function GalleryPrototype({ variant }: { variant: string }) {
  return (
    <div className="flex flex-col gap-4 pb-24">
      <p className="rounded-wk border border-volt-border bg-volt-surface px-4 py-3 text-[13px] text-volt-text-2">
        Creative gallery prototype — mocked data, throwaway. Flip variants with the bar below or the arrow keys.
      </p>
      {variant === "B" ? <VariantTable /> : variant === "C" ? <VariantMasonry /> : <VariantGrid />}
      <PrototypeSwitcher current={variant} />
    </div>
  );
}

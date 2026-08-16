import type { Creative } from "../types/creatives.types";
import { CreativeCard } from "./CreativeCard";

export function CreativesGallery({ creatives }: { creatives: Creative[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
      {creatives.map((creative) => (
        <CreativeCard key={creative.id} creative={creative} />
      ))}
    </div>
  );
}

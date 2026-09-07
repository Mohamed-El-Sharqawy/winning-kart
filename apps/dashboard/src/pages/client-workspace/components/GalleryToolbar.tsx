import { EFFECTIVE_STATUS_OPTIONS, FATIGUE_FLAG_COPY, FATIGUE_FLAG_ORDER } from "../data/gallery-copy.data";
import type { AdFormat, FatigueFlag, StatusFilter } from "../types/creatives.types";
import { FilterChip } from "./FilterChip";

export const SELECT_CLASS =
  "rounded-wk border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";

export interface GalleryToolbarProps {
  adSet: string | undefined;
  adSetName: string | undefined;
  onClearAdSet: () => void;
  status: StatusFilter;
  onStatus: (status: StatusFilter) => void;
  flagFilter: FatigueFlag | "all";
  onFlagFilter: (flag: FatigueFlag | "all") => void;
  formatFilter: "all" | AdFormat;
  onFormatFilter: (format: "all" | AdFormat) => void;
  searchInput: string;
  onSearchInput: (value: string) => void;
  rowCount: number;
}

export function GalleryToolbar({
  adSet,
  adSetName,
  onClearAdSet,
  status,
  onStatus,
  flagFilter,
  onFlagFilter,
  formatFilter,
  onFormatFilter,
  searchInput,
  onSearchInput,
  rowCount,
}: GalleryToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {adSet !== undefined ? <FilterChip label={`Ad set: ${adSetName ?? adSet}`} onClear={onClearAdSet} /> : null}
      <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
        Status
        <select
          aria-label="Status filter"
          value={status}
          onChange={(event) => onStatus(event.target.value as StatusFilter)}
          className={SELECT_CLASS}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <optgroup label="Exact status">
            {EFFECTIVE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </optgroup>
        </select>
      </label>
      <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
        Fatigue
        <select
          aria-label="Fatigue filter"
          value={flagFilter}
          onChange={(event) => onFlagFilter(event.target.value as FatigueFlag | "all")}
          className={SELECT_CLASS}
        >
          <option value="all">All</option>
          {FATIGUE_FLAG_ORDER.map((flag) => (
            <option key={flag} value={flag}>{FATIGUE_FLAG_COPY[flag].label}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
        Format
        <select
          aria-label="Format filter"
          value={formatFilter}
          onChange={(event) => onFormatFilter(event.target.value as "all" | AdFormat)}
          className={SELECT_CLASS}
        >
          <option value="all">All formats</option>
          <option value="IMAGE">Image</option>
          <option value="VIDEO">Video</option>
          <option value="CAROUSEL">Carousel</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
        Search
        <input
          type="search"
          aria-label="Search creatives"
          value={searchInput}
          onChange={(event) => onSearchInput(event.target.value)}
          placeholder="Name or ad copy"
          className={SELECT_CLASS}
        />
      </label>
      <span className="text-[13px] text-volt-text-3">{rowCount} loaded</span>
    </div>
  );
}

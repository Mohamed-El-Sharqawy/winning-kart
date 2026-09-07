import { EFFECTIVE_STATUS_OPTIONS } from "../data/gallery-copy.data";
import type { StatusFilter } from "../types/creatives.types";

const CONTROL_CLASS =
  "rounded-wk border border-volt-border-2 bg-volt-surface-2 px-3 py-2 text-sm text-volt-text focus:border-volt-primary focus:outline-none";

export interface ListFilterBarProps {
  status: StatusFilter;
  onStatus: (status: StatusFilter) => void;
  searchInput: string;
  onSearchInput: (value: string) => void;
  searchLabel: string;
}

export function ListFilterBar({ status, onStatus, searchInput, onSearchInput, searchLabel }: ListFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <label className="flex items-center gap-2 text-[13px] text-volt-text-2">
        Status
        <select
          aria-label="Status filter"
          value={status}
          onChange={(event) => onStatus(event.target.value as StatusFilter)}
          className={CONTROL_CLASS}
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
        Search
        <input
          type="search"
          aria-label={searchLabel}
          value={searchInput}
          onChange={(event) => onSearchInput(event.target.value)}
          placeholder="Name"
          className={CONTROL_CLASS}
        />
      </label>
    </div>
  );
}

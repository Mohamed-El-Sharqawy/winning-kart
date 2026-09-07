import { Fragment } from "react";
import type { DateRange } from "@/shared/components/DateRangeControl";
import type { GalleryAd, GallerySortKey } from "../types/creatives.types";
import { SortHeader } from "./SortHeader";
import type { SortState } from "./SortHeader";
import { GalleryRow } from "./GalleryRow";
import { VideoPlayerRow } from "./VideoPlayerRow";

const COLUMNS: { key: GallerySortKey | null; label: string }[] = [
  { key: null, label: "Creative" },
  { key: null, label: "Status" },
  { key: "spend", label: "Spend" },
  { key: "roas", label: "ROAS" },
  { key: "ctr", label: "CTR" },
  { key: "frequency", label: "Freq" },
  { key: null, label: "Purchases" },
];

export interface GalleryRowData {
  ad: GalleryAd;
  rowKey: string;
}

export interface GalleryTableProps {
  rows: GalleryRowData[];
  sort: SortState;
  onSort: (key: GallerySortKey) => void;
  playingKey: string | null;
  onTogglePlay: (rowKey: string) => void;
  onImageError: (adId: string, failedSrc: string | null) => void;
  accountId: string | null;
  range: DateRange;
  rangeExplicit: boolean;
}

export function GalleryTable({
  rows,
  sort,
  onSort,
  playingKey,
  onTogglePlay,
  onImageError,
  accountId,
  range,
  rangeExplicit,
}: GalleryTableProps) {
  return (
    <div className="overflow-x-auto rounded-wk border border-volt-border bg-volt-surface">
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-volt-border text-[11px] tracking-wider text-volt-text-3 uppercase">
          <tr>
            {COLUMNS.map((column) => {
              const key = column.key;
              return (
                <th key={column.label} className="px-4 py-3 font-medium">
                  {key !== null ? (
                    <SortHeader
                      label={column.label}
                      active={sort.key === key}
                      direction={sort.direction}
                      onClick={() => onSort(key)}
                    />
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ ad, rowKey }) => (
            <Fragment key={rowKey}>
              <GalleryRow ad={ad} rowKey={rowKey} onTogglePlay={onTogglePlay} onImageError={onImageError} />
              {playingKey === rowKey ? (
                <VideoPlayerRow
                  ad={ad}
                  colSpan={COLUMNS.length}
                  accountId={accountId}
                  range={range}
                  rangeExplicit={rangeExplicit}
                  onClose={() => onTogglePlay(rowKey)}
                />
              ) : null}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

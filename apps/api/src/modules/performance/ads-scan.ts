import type { AdsCursor } from "./ads-cursor";
import type { AdsRow } from "./ads-decoration";
import type { AdsPageInput } from "./ads-repository";

export const SCAN_CHUNK = 500;

export type FullAdsScanInput = Omit<AdsPageInput, "cursor" | "limit">;

export async function scanAdsRows(
  pageAds: (input: AdsPageInput) => Promise<AdsRow[]>,
  input: FullAdsScanInput,
  startCursor: AdsCursor | null,
  visit: (row: AdsRow) => boolean
): Promise<void> {
  let cursor = startCursor;
  for (;;) {
    const chunk = await pageAds({ ...input, cursor, limit: SCAN_CHUNK });
    for (const row of chunk) {
      if (!visit(row)) {
        return;
      }
    }
    if (chunk.length < SCAN_CHUNK) {
      return;
    }
    const last = chunk[chunk.length - 1] as AdsRow;
    cursor = { id: last.id, sortValue: last.sortValue };
  }
}

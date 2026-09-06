import { problem } from "../../lib/problem";
import { resolveWindow } from "../../lib/window";
import type { AdsSums } from "./ads-decoration";
import { parseListFilters, parseListOrder, parseListPage, parseListSort } from "./list-query";
import type { ListPageQuery } from "./list-query";
import { toAdSetItem, toCampaignItem, toSummary } from "./list-items";
import type { AdSetDbRow, AdSetItem, CampaignDbRow, CampaignItem, KpiSummary } from "./list-items";
import type { PagedListInput, SummaryInput } from "./list-repository";

export interface ListsDeps {
  findAccount(id: string): Promise<{ id: string } | undefined>;
  pageCampaigns(input: PagedListInput): Promise<{ rows: CampaignDbRow[]; total: number }>;
  pageAdSets(input: PagedListInput): Promise<{ rows: AdSetDbRow[]; total: number }>;
  campaignSummary(input: SummaryInput): Promise<AdsSums>;
  adSetSummary(input: SummaryInput): Promise<AdsSums>;
}

export interface ListPageEnvelope<Item> {
  data: Item[];
  meta: { page: number; pageSize: number; total: number };
}

export type CampaignsPage = ListPageEnvelope<CampaignItem>;
export type AdSetsPage = ListPageEnvelope<AdSetItem>;

function notFound(accountId: string) {
  return problem(404, "RESOURCE_NOT_FOUND", `No ad account with id ${accountId}`);
}

async function requireAccount(deps: ListsDeps, accountId: string): Promise<void> {
  if ((await deps.findAccount(accountId)) === undefined) {
    throw notFound(accountId);
  }
}

function listInput(accountId: string, query: ListPageQuery): PagedListInput {
  const window = resolveWindow(query);
  return {
    accountId,
    since: window.since,
    until: window.until,
    ...parseListFilters(query),
    sort: parseListSort(query.sort),
    order: parseListOrder(query.order),
    ...parseListPage(query),
  };
}

function summaryInput(accountId: string, query: ListPageQuery): SummaryInput {
  const window = resolveWindow(query);
  return {
    accountId,
    since: window.since,
    until: window.until,
    ...parseListFilters(query),
  };
}

export async function campaignsPage(
  deps: ListsDeps,
  accountId: string,
  query: ListPageQuery
): Promise<CampaignsPage> {
  await requireAccount(deps, accountId);
  const input = listInput(accountId, query);
  const { rows, total } = await deps.pageCampaigns(input);
  return {
    data: rows.map(toCampaignItem),
    meta: { page: input.page, pageSize: input.pageSize, total },
  };
}

export async function adSetsPage(
  deps: ListsDeps,
  accountId: string,
  query: ListPageQuery
): Promise<AdSetsPage> {
  await requireAccount(deps, accountId);
  const input = listInput(accountId, query);
  const { rows, total } = await deps.pageAdSets(input);
  return {
    data: rows.map(toAdSetItem),
    meta: { page: input.page, pageSize: input.pageSize, total },
  };
}

export async function campaignsSummary(
  deps: ListsDeps,
  accountId: string,
  query: ListPageQuery
): Promise<KpiSummary> {
  await requireAccount(deps, accountId);
  return toSummary(await deps.campaignSummary(summaryInput(accountId, query)));
}

export async function adSetsSummary(
  deps: ListsDeps,
  accountId: string,
  query: ListPageQuery
): Promise<KpiSummary> {
  await requireAccount(deps, accountId);
  return toSummary(await deps.adSetSummary(summaryInput(accountId, query)));
}

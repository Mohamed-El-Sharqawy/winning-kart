export type ClientStatusDto = "active" | "paused" | "archived";

export interface ClientDto {
  id: string;
  name: string;
  slug: string;
  status: ClientStatusDto;
  displayCurrency: string;
  shareCostAndMarginWithClient?: boolean;
  createdAt: string;
}

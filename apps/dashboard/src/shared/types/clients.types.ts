export type ClientStatus = "active" | "paused" | "archived";

export interface Client {
  id: string;
  name: string;
  slug: string;
  status: ClientStatus;
  displayCurrency: string;
  shareCostAndMarginWithClient: boolean;
  createdAt: Date;
}

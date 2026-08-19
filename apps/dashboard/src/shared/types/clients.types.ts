export type ClientStatus = "active" | "paused" | "archived";

export interface Client {
  id: string;
  name: string;
  slug: string;
  status: ClientStatus;
  industry: string | null;
  displayCurrency: string;
  shareCostAndMarginWithClient: boolean;
  createdAt: Date;
}

export interface PortalClient {
  name: string;
  slug: string;
  displayCurrency: string;
}

export interface PortalKpis {
  spend: number;
  revenue: number;
  roas: number | null;
  purchases: number;
}

export interface PortalDayPoint {
  date: Date;
  label: string;
  spend: number;
  revenue: number;
  roas: number | null;
}

export interface PortalCampaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  revenue: number;
  roas: number | null;
  purchases: number;
}

export interface PortalCreative {
  id: string;
  name: string;
  format: string;
  thumbnailUrl: string | null;
  spend: number;
  roas: number | null;
}

export interface PortalOverview {
  client: PortalClient;
  kpis: PortalKpis;
  series: PortalDayPoint[];
  campaigns: PortalCampaign[];
  creatives: PortalCreative[];
}

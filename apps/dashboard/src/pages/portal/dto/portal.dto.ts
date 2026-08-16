export interface PortalClientDto {
  name: string;
  slug: string;
  displayCurrency: string;
}

export interface PortalKpisDto {
  spend: number;
  revenue: number;
  roas: number | null;
  purchases: number;
}

export interface PortalSeriesPointDto {
  date: string;
  spend: number;
  revenue: number;
  roas: number | null;
}

export interface PortalCampaignDto {
  id: string;
  name: string;
  status: string;
  spend: number;
  revenue: number;
  roas: number | null;
  purchases: number;
}

export interface PortalCreativeDto {
  id: string;
  name: string;
  format: string;
  thumbnailUrl: string | null;
  spend: number;
  roas: number | null;
}

export interface PortalOverviewResponseDto {
  client: PortalClientDto;
  kpis: PortalKpisDto;
  series: PortalSeriesPointDto[];
  campaigns: PortalCampaignDto[];
  creatives: PortalCreativeDto[];
}

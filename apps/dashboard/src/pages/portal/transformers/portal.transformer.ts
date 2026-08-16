import type { PortalOverviewResponseDto, PortalSeriesPointDto } from "../dto/portal.dto";
import type { PortalDayPoint, PortalOverview } from "../types/portal.types";

function toDayPoint(dto: PortalSeriesPointDto): PortalDayPoint {
  const parsed = new Date(`${dto.date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { date: new Date(dto.date), label: dto.date, spend: dto.spend, revenue: dto.revenue, roas: dto.roas };
  }
  return {
    date: parsed,
    label: parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    spend: dto.spend,
    revenue: dto.revenue,
    roas: dto.roas,
  };
}

export function toPortalOverview(dto: PortalOverviewResponseDto): PortalOverview {
  return {
    client: { name: dto.client.name, slug: dto.client.slug, displayCurrency: dto.client.displayCurrency },
    kpis: { spend: dto.kpis.spend, revenue: dto.kpis.revenue, roas: dto.kpis.roas, purchases: dto.kpis.purchases },
    series: dto.series.map(toDayPoint),
    campaigns: dto.campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      spend: campaign.spend,
      revenue: campaign.revenue,
      roas: campaign.roas,
      purchases: campaign.purchases,
    })),
    creatives: dto.creatives.map((creative) => ({
      id: creative.id,
      name: creative.name,
      format: creative.format,
      thumbnailUrl: creative.thumbnailUrl,
      spend: creative.spend,
      roas: creative.roas,
    })),
  };
}

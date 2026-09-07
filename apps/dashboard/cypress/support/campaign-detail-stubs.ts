export const CAMPAIGN_PATH = "/clients/maison-nour/campaigns/fixture-campaign-1";
export const DETAIL_PARAMS =
  "account=act_dia_1&accountName=Dia+Flower+Main&from=2026-08-01&to=2026-08-19";
export const SCOPED_CREATIVES =
  "/clients/maison-nour?tab=creatives" +
  "&adSet=as_df_retention&adSetName=Eid+Retargeting+-+Purchases" +
  "&campaign=fixture-campaign-1&campaignName=Dia+Flower+Eid+Push" +
  "&account=act_dia_1&accountName=Dia+Flower+Main" +
  "&from=2026-08-01&to=2026-08-19";

export function stubCampaignDetail() {
  cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/campaigns(\?.*)?$/, {
    fixture: "walker-campaigns.json",
  });
  cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/campaigns\/summary(\?.*)?$/, {
    fixture: "kpi-summary.json",
  });
  cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/campaigns\/[^/?]+/, {
    fixture: "walker-campaign-detail.json",
  });
}

export function visitCampaignDetail() {
  cy.visit(`${CAMPAIGN_PATH}?days=30&${DETAIL_PARAMS}`);
  cy.contains("Eid Retargeting - Purchases", { timeout: 15000 }).should(
    "be.visible",
  );
}

export function freshAdsAlias(alias: string) {
  cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ads(\?.*)?$/).as(alias);
}

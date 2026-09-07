import {
  CAMPAIGN_PATH,
  SCOPED_CREATIVES,
  freshAdsAlias,
  stubCampaignDetail,
  visitCampaignDetail,
} from "../../support/campaign-detail-stubs";
import { stubGallery } from "../../support/gallery-stubs";

describe("campaign scope and navigation", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();
    stubGallery();
    stubCampaignDetail();
  });

  it("drills from an ad set row into the campaign- and ad-set-scoped creatives tab", () => {
    visitCampaignDetail();
    freshAdsAlias("adsDrill");
    cy.contains("tr,li,[role='row']", "Eid Retargeting - Purchases", { timeout: 15000 })
      .contains("a,button", "Creatives", { timeout: 15000 })
      .click();

    cy.url({ timeout: 15000 }).should("include", "tab=creatives");
    cy.url().should("include", "adSet=as_df_retention");
    cy.url().should("include", "adSetName=Eid+Retargeting");
    cy.url().should("include", "campaign=fixture-campaign-1");
    cy.url().should("include", "campaignName=Dia+Flower+Eid+Push");
    cy.url().should("include", "account=act_dia_1");
    cy.url().should("include", "from=2026-08-01");
    cy.url().should("include", "to=2026-08-19");

    cy.wait("@adsDrill", { timeout: 15000 }).its("request.url").should((url) => {
      expect(url, "ad set scope reaches the server").to.contain("adSetId=as_df_retention");
      expect(url, "campaign scope reaches the server").to.contain("campaignId=fixture-campaign-1");
      expect(url, "crafted links never pin status").to.contain("status=active");
    });

    cy.contains(/ad set: eid retargeting/i, { timeout: 15000 }).should("be.visible");
    cy.contains(/campaign: dia flower eid push/i, { timeout: 15000 }).should("be.visible");
  });

  it("returns to campaign detail from the scoped creatives tab with account and range intact", () => {
    cy.visit(SCOPED_CREATIVES, { timeout: 15000 });
    cy.contains("a", /‹\s*campaign/i, { timeout: 15000 }).should("be.visible").click();

    cy.url({ timeout: 15000 }).should("include", `${CAMPAIGN_PATH}`);
    cy.url().should("include", "account=act_dia_1");
    cy.url().should("include", "from=2026-08-01");
    cy.url().should("include", "to=2026-08-19");
    cy.contains("Eid Retargeting - Purchases", { timeout: 15000 }).should("be.visible");
  });

  it("clears the campaign and ad set chips independently", () => {
    cy.visit(SCOPED_CREATIVES, { timeout: 15000 });
    cy.get("button[aria-label='Clear campaign filter']", { timeout: 15000 }).click();

    cy.url({ timeout: 15000 }).should("not.include", "campaign=");
    cy.url().should("include", "adSet=as_df_retention");
    cy.contains(/ad set: eid retargeting/i, { timeout: 15000 }).should("be.visible");
    cy.contains(/campaign:/i).should("not.exist");

    cy.get("button[aria-label='Clear ad set filter']", { timeout: 15000 }).click();
    cy.url({ timeout: 15000 }).should("not.include", "adSet=");
    cy.contains(/ad set:/i).should("not.exist");
    cy.contains(/campaign:/i).should("not.exist");
  });

  it("opens the creative drawer in place from a top creatives row", () => {
    visitCampaignDetail();
    cy.contains("Eid Hero Video", { timeout: 15000 }).click();

    cy.url({ timeout: 15000 }).should("include", "creative=ad_df_hero_video");
    cy.wait("@adDetail", { timeout: 15000 });
    cy.get("[data-testid='creative-drawer']").should("be.visible");

    cy.get("[data-testid='drawer-close']").click();
    cy.url({ timeout: 15000 }).should("not.include", "creative=");
    cy.url().should("include", "/campaigns/fixture-campaign-1");
    cy.get("[data-testid='creative-drawer']").should("not.exist");
  });

  it("links See all creatives to the tab scoped by campaign only", () => {
    visitCampaignDetail();
    freshAdsAlias("adsSeeAll");
    cy.contains("a", /see all creatives/i, { timeout: 15000 }).click();

    cy.url({ timeout: 15000 }).should("include", "tab=creatives");
    cy.url().should("include", "campaign=fixture-campaign-1");
    cy.url().should("include", "campaignName=Dia+Flower+Eid+Push");
    cy.url().should("include", "account=act_dia_1");
    cy.url().should("not.include", "adSet=");

    cy.wait("@adsSeeAll", { timeout: 15000 }).its("request.url").should((url) => {
      expect(url).to.contain("campaignId=fixture-campaign-1");
      expect(url).to.not.contain("adSetId=");
    });
    cy.contains(/campaign: dia flower eid push/i, { timeout: 15000 }).should("be.visible");
    cy.contains(/ad set:/i).should("not.exist");
  });

  it("preserves account and window params in the breadcrumb campaigns link", () => {
    visitCampaignDetail();
    cy.contains("a", "Dia Flower Main", { timeout: 15000 }).click();

    cy.url({ timeout: 15000 }).should("include", "tab=campaigns");
    cy.url().should("include", "account=act_dia_1");
    cy.url().should("include", "accountName=Dia+Flower+Main");
    cy.url().should("include", "from=2026-08-01");
    cy.url().should("include", "to=2026-08-19");
  });
});

describe("campaign detail", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");

    cy.intercept(
      "GET",
      /\/api\/ad-accounts\/[^/]+\/campaigns\/[^/?]+/,
      { fixture: "campaign-detail.json" },
    ).as("campaignDetail");

    cy.visit(
      "/clients/maison-nour/campaigns/fixture-campaign-1?account=fixture-account&days=30",
    );
  });

  it("renders KPI cards, funnel stages, and the ad sets table from intercepted data", () => {
    cy.contains(/spend/i, { timeout: 15000 }).should("be.visible");
    cy.contains(/roas/i, { timeout: 15000 }).should("be.visible");

    cy.contains(/impressions/i, { timeout: 15000 }).should("be.visible");
    cy.contains(/purchases/i).should("be.visible");

    cy.contains("Eid Retargeting - Purchases", { timeout: 15000 }).should(
      "be.visible",
    );
    cy.contains("Eid Prospecting - Link Clicks").should("be.visible");
  });
});

describe("workspace revenue tab info card", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");

    cy.intercept("GET", /\/api\/clients\/[^/]+\/revenue(\?.*)?$/, {
      fixture: "revenue-events.json",
    }).as("revenueGet");

    cy.intercept("GET", /\/api\/clients\/[^/]+\/revenue-sources(\?.*)?$/, {
      body: { data: [] },
    }).as("revenueSourcesGet");
  });

  it("explains where the revenue data comes from and points at the docs", () => {
    cy.visit("/clients/maison-nour?tab=revenue");

    cy.wait("@revenueGet", { timeout: 20000 });

    cy.contains("Where this data comes from", { timeout: 15000 }).should("be.visible");
    cy.contains(/via the ingest API|through the ingest API/i, { timeout: 15000 }).should(
      "be.visible",
    );
    cy.contains(/Shopify and WooCommerce connectors arrive in V1/, { timeout: 15000 }).should(
      "be.visible",
    );
    cy.contains("docs/revenue-ingest.md", { timeout: 15000 }).should("be.visible");
  });
});

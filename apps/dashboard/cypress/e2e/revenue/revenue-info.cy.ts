describe("workspace revenue tab info card", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();

    cy.intercept("GET", /\/api\/clients\/[^/]+\/revenue(\?.*)?$/, {
      fixture: "revenue-events.json",
    }).as("revenueGet");

    cy.intercept("GET", /\/api\/clients\/[^/]+\/revenue-sources(\?.*)?$/, {
      body: { data: [] },
    }).as("revenueSourcesGet");
  });

  it("explains where the revenue data comes from and links the integration guide", () => {
    cy.visit("/clients/maison-nour?tab=revenue");

    cy.wait("@revenueGet", { timeout: 20000 });

    cy.contains("Where this data comes from", { timeout: 15000 }).should("be.visible");
    cy.contains(/via the ingest API|through the ingest API/i, { timeout: 15000 }).should(
      "be.visible",
    );
    cy.contains(/Shopify and WooCommerce connectors arrive in V1/, { timeout: 15000 }).should(
      "be.visible",
    );
    cy.contains("a", "integration guide", { timeout: 15000 })
      .should("be.visible")
      .and("have.attr", "href")
      .and("include", "/docs/integrations");
  });
});

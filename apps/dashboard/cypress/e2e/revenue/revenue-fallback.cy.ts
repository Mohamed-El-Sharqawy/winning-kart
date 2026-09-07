describe("revenue ledger campaign fallback", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();
    cy.intercept("GET", /\/api\/clients\/[^/]+\/revenue(\?.*)?$/, {
      fixture: "revenue-events.json",
    });
    cy.intercept("GET", /\/api\/clients\/[^/]+\/revenue-sources(\?.*)?$/, {
      fixture: "walker-revenue-sources.json",
    });
  });

  it("renders a fallback label for events whose campaign reference no longer resolves", () => {
    cy.visit("/clients/maison-nour?tab=revenue");

    cy.contains("ord_2088", { timeout: 15000 }).should("be.visible");
    cy.contains("Unknown campaign", { timeout: 15000 }).should("be.visible");
    cy.contains("Ramadan Retargeting", { timeout: 15000 }).should(
      "be.visible",
    );
  });
});

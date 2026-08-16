describe("client portal dashboard", () => {
  beforeEach(() => {
    cy.loginAs("client");

    cy.intercept("GET", /\/api\/portal\/overview(\?.*)?$/, {
      fixture: "portal-overview.json",
    }).as("portalOverview");
  });

  it("lands on /portal and renders the overview without agency navigation", () => {
    cy.visit("/");

    cy.url({ timeout: 15000 }).should("include", "/portal");
    cy.wait("@portalOverview");

    cy.contains("Maison Nour", { timeout: 15000 }).should("be.visible");

    ["Spend", "Revenue", "ROAS", "Purchases"].forEach((label) => {
      cy.contains(label, { timeout: 15000 }).should("be.visible");
    });

    cy.contains("for every AED 1 spent", { timeout: 15000 }).should(
      "be.visible",
    );

    cy.contains("Ramadan Retargeting", { timeout: 15000 }).should(
      "be.visible",
    );
    cy.contains("Prospecting Broad").should("be.visible");

    cy.contains("Alerts & Tasks", { timeout: 15000 }).should("not.exist");
    cy.contains("Team & Permissions").should("not.exist");

    cy.contains(/creatives/i, { timeout: 15000 }).should("be.visible");
    cy.contains("Ramadan Hero Square").should("be.visible");
    cy.contains("Eid Carousel Story").should("be.visible");
  });
});

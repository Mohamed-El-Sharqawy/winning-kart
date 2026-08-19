describe("sidebar disabled items", () => {
  const DISABLED_LABELS = [
    "Reports",
    "Analytics",
    "Audiences",
    "Budget & Pacing",
    "Marketing Plans",
    "Integrations",
  ];

  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.visit("/overview");
    cy.get("nav", { timeout: 15000 }).should("be.visible");
  });

  it("keeps upcoming items as non-links that do not navigate", () => {
    DISABLED_LABELS.forEach((label) => {
      cy.get("nav")
        .contains(label, { timeout: 15000 })
        .closest("a")
        .should("not.exist");
    });

    DISABLED_LABELS.forEach((label) => {
      cy.get("nav").contains(label).click({ force: true });
      cy.location("pathname", { timeout: 15000 }).should("eq", "/overview");
    });
  });

  it("links Team & Permissions to the team page", () => {
    cy.get("nav")
      .contains("a", "Team & Permissions", { timeout: 15000 })
      .should("be.visible")
      .and("have.attr", "href")
      .and("include", "/team");
  });
});

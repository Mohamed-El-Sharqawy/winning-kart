describe("overview actionable insights region", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");

    cy.intercept("GET", /\/api\/overview(\?.*)?$/, {
      fixture: "overview.json",
    }).as("overviewGet");
    cy.intercept("GET", /\/api\/alerts\/bell(\?.*)?$/, {
      fixture: "bell.json",
    });
    cy.intercept("GET", /\/api\/insights(\?.*)?$/, {
      fixture: "insights.json",
    });
    cy.intercept("GET", /\/api\/alerts(\?.*)?$/, { fixture: "alerts.json" });

    cy.visit("/overview");
  });

  it("renders the top insights with a link to all recommendations", () => {
    cy.wait("@overviewGet");

    cy.contains(/actionable insights/i, { timeout: 15000 }).should("be.visible");
    cy.contains("Maison Nour ROAS fell 28% over 7 days", {
      timeout: 15000,
    }).should("be.visible");

    cy.contains("a, button", /(show|view) all/i).click();

    cy.url({ timeout: 15000 }).should("include", "/alerts");
    cy.url().should("include", "tab=recommendations");
  });
});

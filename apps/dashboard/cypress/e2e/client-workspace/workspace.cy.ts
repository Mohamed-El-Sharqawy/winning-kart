describe("client workspace", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
  });

  it("navigates from the clients list into the workspace tabs", () => {
    cy.visit("/clients");

    cy.contains("a", "Maison Nour").click();
    cy.url().should("include", "/clients/maison-nour");

    ["Overview", "Ad Accounts", "Campaigns"].forEach((label) => {
      cy.contains("[role='tab'], a, button", label).should("be.visible");
    });

    cy.contains("[role='tab'], a, button", "Ad Accounts").click();
    cy.url().should("include", "ad-accounts");
    cy.contains("act_nour_1", { timeout: 15000 }).should("be.visible");

    cy.contains("[role='tab'], a, button", "Campaigns").click();
    cy.url().should("include", "campaigns");
    cy.contains("No campaigns", { timeout: 15000 }).should("be.visible");

    cy.visit("/clients/maison-nour?tab=overview");
    cy.contains("Spend", { timeout: 15000 }).should("be.visible");
    cy.contains("Revenue").should("be.visible");
  });
});

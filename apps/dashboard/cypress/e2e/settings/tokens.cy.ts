describe("settings tokens", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
  });

  it("creates, dismisses, and revokes an api token", () => {
    cy.visit("/settings/tokens");

    cy.contains("label", /name/i).find("input").type("e2e-token");
    cy.contains("button", /create/i).click();

    cy.contains("wkpat_").should("be.visible");
    cy.contains("button", /dismiss|close|done|got it/i).click();
    cy.contains("wkpat_").should("not.exist");

    const row = () => cy.contains("[data-testid='token-row'], tr, li", "e2e-token");
    row().contains("button", /revoke/i).click();
    row().contains(/revoked/i).should("be.visible");
  });
});

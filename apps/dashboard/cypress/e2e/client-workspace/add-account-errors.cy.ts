describe("add ad account error handling", () => {
  it("surfaces a Meta validation error or wizard progress, never a crash", () => {
    cy.loginAs("agency-admin");
    cy.visit("/clients/maison-nour?tab=ad-accounts");

    cy.contains("button", "Add ad account").click();
    cy.get("[role='dialog'], dialog").should("be.visible");

    cy.contains("label", /name/i).find("input").type("Test");
    cy.contains("label", /ad account id/i).find("input").type("act_123");
    cy.contains("label", /access token/i).find("input").type("EAAtotallyinvalidtoken123456");

    cy.get("[role='dialog'], dialog")
      .contains("button", /^(add|connect|create|save|submit|next|continue)/i)
      .click();

    cy.get("body", { timeout: 30000 }).should(($body) => {
      const text = $body.text();
      const hasError = /invalid token|invalid_token|rejected|unavailable/i.test(text);
      const hasProgress = /validating|verifying|fetching|progress/i.test(text);
      expect(hasError || hasProgress, "shows a validation error or wizard progress").to.be.true;
    });

    cy.get("body").then(($body) => {
      const dialog = $body.find("[role='dialog'], dialog");
      const hasError = /invalid token|invalid_token|rejected|unavailable/i.test($body.text());
      if (dialog.length && hasError) {
        cy.wrap(dialog.first()).should("be.visible");
      } else {
        cy.contains(/validating|verifying|fetching|progress/i).should("be.visible");
      }
    });
  });
});

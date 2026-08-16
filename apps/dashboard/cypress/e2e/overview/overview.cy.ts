describe("overview", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
  });

  it("renders KPI cards and the account health area", () => {
    cy.visit("/overview");

    cy.contains("Spend", { timeout: 15000 }).should("be.visible");
    cy.contains("Revenue").should("be.visible");
    cy.contains("ROAS").should("be.visible");

    cy.get("body").should(($body) => {
      const text = $body.text();
      const fresh = /all accounts syncing fresh/i.test(text);
      const issues = /issue|warning|error|unhealthy|needs attention/i.test(text);
      expect(fresh || issues, "health area renders").to.be.true;
    });
  });
});

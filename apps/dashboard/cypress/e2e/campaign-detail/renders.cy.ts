const CAMPAIGN_NAME = "Profitlab | Creative Testing | ABO | 5/7";

describe("campaign detail rendering", () => {
  [1, 2, 3].forEach((attempt) => {
    it(`attempt ${attempt}: renders from campaigns tab without crashing`, () => {
      cy.loginAs("agency-admin");
      cy.visit("/clients/dia-flower?tab=campaigns", { timeout: 20000 });
      cy.contains(CAMPAIGN_NAME, { timeout: 20000 }).should("be.visible");
      cy.contains("a,button", CAMPAIGN_NAME).click();
      cy.url({ timeout: 15000 }).should("include", "/campaigns/");
      cy.contains(CAMPAIGN_NAME, { timeout: 15000 }).should("be.visible");
      cy.get("[data-testid='route-error']").should("not.exist");
      cy.get("svg[role='img']").should("exist");
    });
  });
});

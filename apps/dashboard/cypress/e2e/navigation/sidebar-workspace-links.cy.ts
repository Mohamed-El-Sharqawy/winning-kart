describe("sidebar workspace links", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();

    cy.intercept("GET", /\/api\/clients\/[^/]+\/ad-accounts(\?.*)?$/, {
      fixture: "walker-ad-accounts.json",
    });
    cy.intercept("GET", /\/api\/clients\/[^/]+\/revenue(\?.*)?$/, {
      fixture: "walker-revenue.json",
    });
    cy.intercept("GET", /\/api\/clients\/[^/]+\/revenue-sources(\?.*)?$/, {
      fixture: "walker-revenue-sources.json",
    });
  });

  it("falls back to the clients roster before any workspace client is visited", () => {
    cy.visit("/overview");
    cy.reload();

    cy.get("nav", { timeout: 15000 }).should("be.visible");
    cy.get("nav")
      .contains("a", "Campaigns", { timeout: 15000 })
      .should("have.attr", "href")
      .and("include", "/clients");
  });

  it("routes workspace links to the visited client with the right tab", () => {
    cy.visit("/clients");

    cy.contains("a", "Maison Nour", { timeout: 15000 }).click();
    cy.url({ timeout: 15000 }).should("include", "/clients/maison-nour");

    cy.get("nav").contains("a", "Ad Accounts", { timeout: 15000 }).should("be.visible");
    cy.get("nav").contains("a", "Attribution & Revenue", { timeout: 15000 }).should("be.visible");

    cy.get("nav").contains("a", "Ad Accounts").click();
    cy.url({ timeout: 15000 }).should("include", "/clients/maison-nour");
    cy.url().should("include", "tab=ad-accounts");

    cy.get("nav").contains("a", "Attribution & Revenue").click();
    cy.url({ timeout: 15000 }).should("include", "/clients/maison-nour");
    cy.url().should("include", "tab=revenue");

    cy.window()
      .its("localStorage")
      .invoke("getItem", "wk.workspace.client")
      .should("include", "maison-nour");
  });
});

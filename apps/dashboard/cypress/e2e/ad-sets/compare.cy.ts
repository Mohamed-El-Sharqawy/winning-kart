describe("ad sets compare", () => {
  const AD_SET_NAMES = [
    "Nour Broad - Purchases",
    "Nour Retargeting - Link Clicks",
    "Nour Lookalike 2% - Purchases",
  ];

  beforeEach(() => {
    cy.loginAs("agency-admin");

    cy.intercept(
      "GET",
      /\/api\/ad-accounts\/[^/]+\/ad-sets/,
      { fixture: "ad-sets.json" },
    ).as("adSets");
    cy.intercept(
      "GET",
      /\/api\/ad-accounts\/[^/]+\/ads(\?.*)?$/,
      { fixture: "ads.json" },
    ).as("ads");
    cy.intercept(
      "GET",
      /\/api\/ad-accounts\/[^/]+\/fatigue-summary/,
      { fixture: "fatigue-summary.json" },
    ).as("fatigueSummary");

    cy.visit("/clients/maison-nour?tab=ad-sets");
  });

  it("renders three ad set rows, compares two in a drawer, and closes with Escape", () => {
    AD_SET_NAMES.forEach((name) => {
      cy.contains(name, { timeout: 15000 }).should("be.visible");
    });

    cy.get("tr, [role='row']", { timeout: 15000 })
      .filter((_, el) =>
        AD_SET_NAMES.some((name) => (el.textContent || "").includes(name)),
      )
      .should("have.length", 3);

    cy.contains("tr, [role='row']", AD_SET_NAMES[0])
      .find("input[type='checkbox']")
      .click({ force: true });
    cy.contains("tr, [role='row']", AD_SET_NAMES[1])
      .find("input[type='checkbox']")
      .click({ force: true });

    cy.contains("button", /compare/i, { timeout: 15000 })
      .should("not.be.disabled")
      .click();

    const drawerSelector =
      "[role='dialog'], dialog, [data-state='open'], aside, [class*='drawer'], [class*='Drawer']";

    cy.get(drawerSelector, { timeout: 15000 }).should(($drawer) => {
      expect($drawer.length, "drawer mounted").to.be.greaterThan(0);
      const visible = $drawer.toArray().some((el) => Cypress.$(el).is(":visible"));
      expect(visible, "drawer visible").to.be.true;
    });

    cy.contains(/baseline/i, { timeout: 15000 }).should("be.visible");

    cy.get("body").should(($body) => {
      const text = $body.text();
      const explicit =
        /mixed optimization|optimization goals? differ|different optimization goals?|mixed goals/i.test(
          text,
        );
      const loose = /optimization/i.test(text) && /mixed|differ/i.test(text);
      expect(explicit || loose, "mixed-optimization note visible").to.be.true;
    });

    cy.get("body").type("{esc}");

    cy.get(drawerSelector).should(($drawer) => {
      const anyVisible = $drawer
        .toArray()
        .some((el) => Cypress.$(el).is(":visible"));
      expect(anyVisible, "drawer closed after Escape").to.be.false;
    });
  });
});

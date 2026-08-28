describe("alerts and overview against the empty seeded database", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();

    cy.intercept("GET", /\/api\/alerts(\?.*)?$/, { body: { data: [] } });
    cy.intercept("GET", /\/api\/alerts\/bell(\?.*)?$/, { body: { data: [] } });
    cy.intercept("GET", /\/api\/insights(\?.*)?$/, { body: { data: [] } });
    cy.intercept("GET", /\/api\/tasks(\?.*)?$/, { body: { data: [] } });
    cy.intercept("GET", /\/api\/overview(\?.*)?$/, { fixture: "overview.json" });
  });

  it("shows the All clear empty state on the alerts page", () => {
    cy.visit("/alerts");

    cy.contains(/all clear/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").should(($body) => {
      expect(
        /application error|uncaught|white screen/i.test($body.text()),
        "no crash screen",
      ).to.be.false;
    });
  });

  it("renders the overview page without alert or insight data", () => {
    cy.visit("/overview");

    cy.contains(/spend/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").should(($body) => {
      expect(
        /application error|uncaught|white screen/i.test($body.text()),
        "no crash screen",
      ).to.be.false;
    });
  });
});

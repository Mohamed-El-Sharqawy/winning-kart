describe("alerts management", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();

    cy.intercept("GET", /\/api\/insights(\?.*)?$/, { body: { data: [] } });
    cy.intercept("GET", /\/api\/tasks(\?.*)?$/, { body: { data: [] } });
    cy.intercept("GET", /\/api\/alerts\/bell(\?.*)?$/, { fixture: "bell.json" });
    cy.intercept("GET", /\/api\/alerts(\?.*)?$/, { fixture: "alerts.json" }).as("alertsGet");
    cy.intercept("DELETE", /\/api\/alerts\/[^/?]+(\?.*)?$/, {
      statusCode: 200,
      body: { data: { ok: true } },
    }).as("alertsDelete");

    cy.visit("/alerts");
  });

  it("deletes an alert after confirming inline", () => {
    cy.wait("@alertsGet", { timeout: 15000 });
    cy.contains("Creative fatigue detected", { timeout: 15000 }).should("be.visible");

    cy.get("body").then(($body) => {
      const $card = $body
        .find("article, li, section, [role='listitem'], div")
        .filter((_, el) => /Creative fatigue detected/.test(el.textContent ?? ""))
        .filter(
          (_, el) =>
            Cypress.$(el)
              .find("button")
              .filter((_, button) => /^delete$/i.test((button.textContent ?? "").trim()))
              .length > 0,
        )
        .last();
      cy.wrap($card).contains("button", /^delete$/i).click();
    });

    cy.contains("button", /confirm delete/i, { timeout: 15000 }).click();

    cy.wait("@alertsDelete", { timeout: 15000 })
      .its("request.url")
      .should("include", "/api/alerts/alt_002");
  });
});

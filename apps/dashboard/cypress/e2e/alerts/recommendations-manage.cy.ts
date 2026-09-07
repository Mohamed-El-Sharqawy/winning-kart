describe("recommendations management", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();

    cy.intercept("GET", /\/api\/tasks(\?.*)?$/, { body: { data: [] } });
    cy.intercept("GET", /\/api\/insights(\?.*)?$/, { fixture: "insights.json" }).as(
      "insightsGet",
    );
    cy.intercept("POST", /\/api\/insights\/([^/?]+)\/dismiss(\?.*)?$/, {
      statusCode: 200,
      body: { data: { ok: true } },
    }).as("insightDismiss");
    cy.intercept("DELETE", /\/api\/insights\/[^/?]+(\?.*)?$/, {
      statusCode: 200,
      body: { data: { ok: true } },
    }).as("insightDelete");
    cy.intercept("GET", /\/api\/alerts(\?.*)?$/, { fixture: "alerts.json" });
    cy.intercept("GET", /\/api\/alerts\/bell(\?.*)?$/, { fixture: "bell.json" });

    cy.visit("/alerts?tab=recommendations");
  });

  function cardWith(text: string, buttonPattern: RegExp) {
    cy.get("body").then(($body) => {
      const $card = $body
        .find("article, li, section, [role='listitem'], div")
        .filter((_, el) => new RegExp(text).test(el.textContent ?? ""))
        .filter(
          (_, el) =>
            Cypress.$(el)
              .find("button")
              .filter((_, button) => buttonPattern.test((button.textContent ?? "").trim()))
              .length > 0,
        )
        .last();
      cy.wrap($card).contains("button", buttonPattern).click();
    });
  }

  it("dismisses a recommendation", () => {
    cy.wait("@insightsGet", { timeout: 15000 });
    cy.contains("Dune Coffee conversions rely on two creatives", { timeout: 15000 }).should(
      "be.visible",
    );

    cardWith("Dune Coffee conversions rely on two creatives", /^dismiss$/i);

    cy.wait("@insightDismiss", { timeout: 15000 })
      .its("request.url")
      .should("include", "/api/insights/ins_002/dismiss");
  });

  it("deletes a recommendation after confirming inline", () => {
    cy.wait("@insightsGet", { timeout: 15000 });
    cy.contains("Maison Nour ROAS fell 28% over 7 days", { timeout: 15000 }).should(
      "be.visible",
    );

    cardWith("Maison Nour ROAS fell 28%", /^delete$/i);
    cy.contains("button", /confirm delete/i, { timeout: 15000 }).click();

    cy.wait("@insightDelete", { timeout: 15000 })
      .its("request.url")
      .should("include", "/api/insights/ins_001");
  });
});

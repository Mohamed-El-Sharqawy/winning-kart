describe("recommendations tab", () => {
  let accepted: string[] = [];
  let dismissed: string[] = [];
  let insightsFixture: { data: Array<{ id: string; [key: string]: unknown }> };

  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();
    accepted = [];
    dismissed = [];
    cy.fixture("insights.json").then((fixture) => {
      insightsFixture = fixture;
    });

    cy.intercept("GET", /\/api\/tasks(\?.*)?$/, { body: { data: [] } });
    cy.intercept("GET", /\/api\/insights(\?.*)?$/, (req) => {
      const rows = insightsFixture.data
        .filter((row: { id: string }) => !dismissed.includes(row.id))
        .map((row: { id: string; acceptedAsTaskId: string | null }) =>
          accepted.includes(row.id)
            ? { ...row, acceptedAsTaskId: "tsk_010" }
            : row,
        );
      req.reply({ statusCode: 200, body: { data: rows } });
    }).as("insightsGet");

    cy.intercept("POST", /\/api\/insights\/([^/?]+)\/accept(\?.*)?$/, (req) => {
      const id =
        new URL(req.url).pathname.match(/\/api\/insights\/([^/?]+)\/accept$/)?.[1] ??
        "";
      accepted.push(id);
      req.reply({
        statusCode: 200,
        body: { data: { id, acceptedAsTaskId: "tsk_010" } },
      });
    }).as("insightAccept");

    cy.intercept(
      "POST",
      /\/api\/insights\/([^/?]+)\/not-useful(\?.*)?$/,
      (req) => {
        const id =
          new URL(req.url).pathname.match(
            /\/api\/insights\/([^/?]+)\/not-useful$/,
          )?.[1] ?? "";
        dismissed.push(id);
        req.reply({ statusCode: 200, body: { data: { id, dismissed: true } } });
      },
    ).as("insightReject");

    cy.intercept("GET", /\/api\/alerts(\?.*)?$/, { fixture: "alerts.json" });
    cy.intercept("GET", /\/api\/alerts\/bell(\?.*)?$/, {
      fixture: "bell.json",
    });

    cy.visit("/alerts?tab=recommendations");
  });

  it("renders insight cards with cause attribution", () => {
    cy.wait("@insightsGet");

    cy.contains("Maison Nour ROAS fell 28% over 7 days", {
      timeout: 15000,
    }).should("be.visible");
    cy.contains("Dune Coffee conversions rely on two creatives", {
      timeout: 15000,
    }).should("be.visible");

    cy.contains(/cause:/i, { timeout: 15000 }).should("be.visible");
    cy.contains(/unattributed/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").should("not.contain", "unattribuated");
  });

  it("accepts an insight as a task and marks another not useful", () => {
    cy.contains("Maison Nour ROAS fell 28% over 7 days", {
      timeout: 15000,
    }).should("be.visible");

    cy.get("body").then(($body) => {
      const $card = $body
        .find("article, li, section, [role='listitem'], div")
        .filter((_, el) =>
          /Maison Nour ROAS fell 28% over 7 days/.test(el.textContent ?? ""),
        )
        .filter(
          (_, el) =>
            Cypress.$(el)
              .find("button")
              .filter((_, button) => /accept/i.test(button.textContent ?? ""))
              .length > 0,
        )
        .last();
      cy.wrap($card).contains("button", /accept/i).click();
    });

    cy.wait("@insightAccept", { timeout: 15000 })
      .its("response.statusCode")
      .should("eq", 200);

    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text();
      const acceptedLabel = /accepted/i.test(text);
      const disabledAccept =
        $body
          .find("button:disabled, button[aria-disabled='true']")
          .filter((_, el) => /accept/i.test(el.textContent ?? ""))
          .length > 0;
      expect(
        acceptedLabel || disabledAccept,
        "accept action reflected on the card",
      ).to.be.true;
    });

    cy.get("body").then(($body) => {
      const $card = $body
        .find("article, li, section, [role='listitem'], div")
        .filter((_, el) =>
          /Dune Coffee conversions rely on two creatives/.test(
            el.textContent ?? "",
          ),
        )
        .filter(
          (_, el) =>
            Cypress.$(el)
              .find("button")
              .filter((_, button) =>
                /not useful/i.test(button.textContent ?? ""),
              )
              .length > 0,
        )
        .last();
      cy.wrap($card).contains("button", /not useful/i).click();
    });

    cy.wait("@insightReject", { timeout: 15000 })
      .its("response.statusCode")
      .should("eq", 200);
  });
});

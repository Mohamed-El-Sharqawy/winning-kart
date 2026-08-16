describe("alerts feed", () => {
  let acknowledged: string[] = [];

  const severityRank: Record<string, number> = {
    info: 0,
    warning: 1,
    critical: 2,
  };

  beforeEach(() => {
    cy.loginAs("agency-admin");
    acknowledged = [];

    cy.intercept("GET", /\/api\/alerts\/bell(\?.*)?$/, { fixture: "bell.json" });

    cy.intercept("GET", /\/api\/alerts(\?.*)?$/, (req) => {
      cy.fixture("alerts.json").then((fixture) => {
        const params = new URL(req.url).searchParams;
        let rows = fixture.data.map((row: { id: string; [key: string]: unknown }) =>
          acknowledged.includes(row.id)
            ? { ...row, status: "acknowledged" }
            : row,
        );
        const severity = params.get("severity");
        const minSeverity = params.get("minSeverity");
        const status = params.get("status");
        if (severity) {
          rows = rows.filter(
            (row) => String(row.severity).toLowerCase() === severity.toLowerCase(),
          );
        }
        if (minSeverity) {
          const floor = severityRank[minSeverity.toLowerCase()] ?? 0;
          rows = rows.filter(
            (row) => (severityRank[String(row.severity)] ?? 0) >= floor,
          );
        }
        if (status) {
          rows = rows.filter((row) => row.status === status);
        }
        req.reply({ statusCode: 200, body: { data: rows } });
      });
    }).as("alertsGet");

    cy.intercept(
      "POST",
      /\/api\/alerts\/([^/?]+)\/acknowledge(\?.*)?$/,
      (req) => {
        const id =
          new URL(req.url).pathname.match(
            /\/api\/alerts\/([^/?]+)\/acknowledge$/,
          )?.[1] ?? "";
        acknowledged.push(id);
        req.reply({
          statusCode: 200,
          body: { data: { id, status: "acknowledged" } },
        });
      },
    ).as("acknowledgePost");

    cy.visit("/alerts");
  });

  it("renders alert cards, filters by severity, and acknowledges the critical alert", () => {
    cy.wait("@alertsGet");

    cy.contains("ROAS fell 28%", { timeout: 15000 }).should("be.visible");
    cy.contains("Dune Coffee", { timeout: 15000 }).should("be.visible");
    cy.contains("Zaytoun", { timeout: 15000 }).should("be.visible");

    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text();
      expect(/\bcritical\b/i.test(text), "critical severity label").to.be.true;
      expect(/\bwarning\b/i.test(text), "warning severity label").to.be.true;
      expect(/\binfo\b/i.test(text), "info severity label").to.be.true;
    });

    cy.get("body").then(($body) => {
      const $select = $body
        .find("select")
        .filter((_, el) =>
          Array.from((el as HTMLSelectElement).options).some((option) =>
            /^critical$/i.test(option.textContent?.trim() ?? ""),
          ),
        )
        .first();
      if ($select.length) {
        const $option = $select
          .find("option")
          .filter((_, el) => /^critical$/i.test(el.textContent?.trim() ?? ""))
          .first();
        cy.wrap($select).select(($option.val() as string) || "critical");
      } else {
        const $critical = $body
          .find("button, [role='tab'], [role='menuitem'], label")
          .filter((_, el) => /^critical$/i.test((el.textContent ?? "").trim()))
          .first();
        cy.wrap($critical).click();
      }
    });

    cy.contains("ROAS fell 28%", { timeout: 15000 }).should("be.visible");
    cy.get("body").should("not.contain", "Creative fatigue");
    cy.get("body").should("not.contain", "AED 620");

    cy.get("body").then(($body) => {
      const $card = $body
        .find("article, li, section, [role='listitem'], div")
        .filter((_, el) => /ROAS fell 28%/.test(el.textContent ?? ""))
        .filter(
          (_, el) =>
            Cypress.$(el)
              .find("button")
              .filter((_, button) => /acknowledge/i.test(button.textContent ?? ""))
              .length > 0,
        )
        .last();
      cy.wrap($card).contains("button", /acknowledge/i).click();
    });

    cy.wait("@acknowledgePost", { timeout: 15000 })
      .its("response.statusCode")
      .should("eq", 200);

    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text();
      const cardGone = !/ROAS fell 28%/.test(text);
      const statusChanged = /acknowledged/i.test(text);
      const ackDisabled =
        $body
          .find("button:disabled, button[aria-disabled='true']")
          .filter((_, el) => /acknowledge/i.test(el.textContent ?? ""))
          .length > 0;
      const ackGone = !/acknowledge/i.test(text);
      expect(
        cardGone || statusChanged || ackDisabled || ackGone,
        "acknowledge reflected in the feed",
      ).to.be.true;
    });
  });
});

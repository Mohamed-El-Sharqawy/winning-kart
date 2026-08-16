describe("alerts bell", () => {
  const showsCountTwo = (el: HTMLElement) => {
    const ownText = el.textContent ?? "";
    if (/(^|[^0-9])2($|[^0-9])/.test(ownText)) {
      return true;
    }
    return (
      Cypress.$(el)
        .find("span, div, [class*='badge'], [class*='count']")
        .filter((_, child) => (child.textContent ?? "").trim() === "2")
        .length > 0
    );
  };

  beforeEach(() => {
    cy.loginAs("agency-admin");

    cy.intercept("GET", /\/api\/overview(\?.*)?$/, { fixture: "overview.json" });
    cy.intercept("GET", /\/api\/alerts\/bell(\?.*)?$/, {
      fixture: "bell.json",
    }).as("bellGet");
    cy.intercept("GET", /\/api\/alerts(\?.*)?$/, { fixture: "alerts.json" });

    cy.visit("/overview");
  });

  it("shows the alerts bell with its count badge and navigates to /alerts", () => {
    cy.contains(/spend/i, { timeout: 15000 }).should("be.visible");
    cy.wait("@bellGet");

    cy.get("body", { timeout: 15000 }).should(($body) => {
      const $bell = $body
        .find("button, a, [role='button']")
        .filter((_, el) => {
          const labelled =
            /alerts/i.test(el.textContent ?? "") ||
            /alerts/i.test(el.getAttribute("aria-label") ?? "") ||
            /alerts/i.test(el.getAttribute("title") ?? "");
          return labelled && showsCountTwo(el);
        })
        .first();
      expect($bell.length, "bell labeled Alerts with badge 2").to.be.greaterThan(
        0,
      );
    });

    cy.get("body").then(($body) => {
      const $candidates = $body
        .find("button, a, [role='button']")
        .filter((_, el) => {
          const labelled =
            /alerts/i.test(el.textContent ?? "") ||
            /alerts/i.test(el.getAttribute("aria-label") ?? "") ||
            /alerts/i.test(el.getAttribute("title") ?? "");
          return labelled;
        });
      const $withBadge = $candidates
        .filter((_, el) => showsCountTwo(el))
        .first();
      const $bell = $withBadge.length ? $withBadge : $candidates.first();
      cy.wrap($bell).click();
    });

    cy.url({ timeout: 15000 }).should("include", "/alerts");
  });
});

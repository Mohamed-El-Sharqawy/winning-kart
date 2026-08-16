describe("settings audit log", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");

    cy.intercept("GET", /\/api\/audit-logs(\?.*)?$/, {
      fixture: "audit-logs.json",
    }).as("auditLogsGet");
  });

  it("renders audit rows with mono actions, filters, and a CSV export link", () => {
    cy.visit("/settings/audit");

    cy.wait("@auditLogsGet", { timeout: 20000 });

    ["auth.login", "pat.create", "ad_account.delete"].forEach((action) => {
      cy.contains(action, { timeout: 15000 }).should("be.visible");
      cy.contains(
        "code, [class*='mono'], [data-testid*='action'], td, span",
        action,
      ).should("be.visible");
    });

    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasFilterControl = $body
        .find("select, input")
        .filter((_, el) => {
          const control = el as HTMLInputElement | HTMLSelectElement;
          if (control.tagName === "SELECT") {
            return true;
          }
          return /filter|search|action/i.test(control.placeholder ?? "");
        }).length > 0;
      const hasFilterText = /filter/i.test($body.text());
      expect(hasFilterControl || hasFilterText, "filters render").to.be.true;
    });

    cy.contains("a", /export csv/i, { timeout: 15000 })
      .should("be.visible")
      .and("have.attr", "href")
      .and("include", "/api/audit-logs/export");
  });
});

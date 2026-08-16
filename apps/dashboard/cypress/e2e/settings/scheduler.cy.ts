describe("settings scheduler", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");

    cy.intercept("GET", /\/api\/scheduler\/status(\?.*)?$/, {
      fixture: "scheduler-status.json",
    }).as("schedulerStatus");

    cy.intercept("GET", /\/api\/scheduler\/jobs(\?.*)?$/, {
      fixture: "scheduler-jobs.json",
    }).as("schedulerJobs");
  });

  it("renders sync status, account health, failure counts, and recent jobs", () => {
    cy.visit("/settings/scheduler");

    cy.wait("@schedulerStatus", { timeout: 20000 });
    cy.wait("@schedulerJobs", { timeout: 20000 });

    cy.contains(/hourly sync/i, { timeout: 15000 }).should("be.visible");

    cy.contains("Maison Nour - Main", { timeout: 15000 }).should("be.visible");
    cy.contains("GCC", { timeout: 15000 }).should("be.visible");

    cy.contains(
      "tr, li, [role='row'], [data-testid*='account']",
      "GCC",
      { timeout: 15000 },
    )
      .contains("3")
      .should("be.visible")
      .and(($el) => {
        const warm = (css: string) => {
          const rgb = css.match(/\d+/g)?.map(Number) ?? [];
          return rgb.length >= 3 && rgb[0] > rgb[1] && rgb[0] > rgb[2];
        };
        expect(
          warm($el.css("color")) || warm($el.css("background-color")),
          "failure count reads as coral/red",
        ).to.be.true;
      });

    ["insights", "account_info", "campaigns"].forEach((stage) => {
      cy.contains(new RegExp(`\\b${stage.replace(/_/g, "[ _]")}\\b`, "i"), {
        timeout: 15000,
      }).should("be.visible");
    });
  });
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function mapJson(value: unknown, fn: (text: string) => string): unknown {
  if (typeof value === "string") return fn(value);
  if (Array.isArray(value)) return value.map((item) => mapJson(item, fn));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, mapJson(item, fn)]),
    );
  }
  return value;
}

function shiftedFromNow(body: unknown): unknown {
  const timestamps: number[] = [];
  mapJson(body, (text) => {
    if (ISO_DATE.test(text)) timestamps.push(Date.parse(text));
    return text;
  });
  const offset = Date.now() - Math.max(0, ...timestamps);
  return mapJson(body, (text) =>
    ISO_DATE.test(text) ? new Date(Date.parse(text) + offset).toISOString() : text,
  );
}

function stubSchedulerJson(path: RegExp, fixture: string, alias: string) {
  cy.fixture(fixture).then((body) => {
    cy.intercept("GET", path, { body: shiftedFromNow(body) }).as(alias);
  });
}

describe("settings scheduler", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");

    stubSchedulerJson(/\/api\/scheduler\/status(\?.*)?$/, "scheduler-status.json", "schedulerStatus");
    stubSchedulerJson(/\/api\/scheduler\/jobs(\?.*)?$/, "scheduler-jobs.json", "schedulerJobs");
  });

  it("renders sync status, account health, failure counts, and recent jobs", () => {
    cy.visit("/settings/scheduler");

    cy.wait("@schedulerStatus", { timeout: 20000 });
    cy.wait("@schedulerJobs", { timeout: 20000 });

    cy.contains(/hourly sync/i, { timeout: 15000 }).should("be.visible");

    cy.contains("Maison Nour - Main", { timeout: 15000 }).should("be.visible");
    cy.contains("GCC", { timeout: 15000 }).should("be.visible");

    cy.contains('[data-testid="recent-failures"]', "3", { timeout: 15000 })
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

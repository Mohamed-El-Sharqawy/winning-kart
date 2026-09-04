interface RouteCheck {
  name: string;
  path: string;
  anchor: RegExp;
}

const DIA = "/clients/dia-flower";
const CAMPAIGN_ID = "4cc1b849-e256-4cd9-a632-bfe593bbf9a1";

const ROUTES: RouteCheck[] = [
  { name: "overview", path: "/overview", anchor: /account health/i },
  { name: "clients list", path: "/clients", anchor: /dia flower/i },
  { name: "workspace overview tab", path: `${DIA}?tab=overview`, anchor: /ad account health/i },
  { name: "workspace campaigns tab", path: `${DIA}?tab=campaigns`, anchor: /dia flower eid push/i },
  { name: "workspace ad sets tab", path: `${DIA}?tab=ad-sets`, anchor: /nour broad - purchases/i },
  { name: "workspace creatives tab", path: `${DIA}?tab=creatives`, anchor: /concentration risk/i },
  { name: "workspace revenue tab", path: `${DIA}?tab=revenue`, anchor: /total revenue/i },
  { name: "alerts feed", path: "/alerts", anchor: /alerts & tasks/i },
  { name: "tasks tab", path: "/alerts?tab=tasks", anchor: /new task/i },
  { name: "team", path: "/team", anchor: /team & permissions/i },
  { name: "settings tokens", path: "/settings/tokens", anchor: /access tokens/i },
  { name: "settings audit", path: "/settings/audit", anchor: /audit log/i },
  { name: "settings data", path: "/settings/data", anchor: /download full export/i },
  { name: "settings scheduler", path: "/settings/scheduler", anchor: /sync jobs/i },
  { name: "integration docs", path: "/docs/integrations", anchor: /generate ingest key/i },
  { name: "attribution docs", path: "/docs/attribution", anchor: /why attribution matters/i },
  {
    name: "campaign detail",
    path: `${DIA}/campaigns/${CAMPAIGN_ID}?days=30`,
    anchor: /dia flower eid push/i,
  },
];

function stubApi() {
  cy.intercept("GET", /\/api\/auth\/me(\?.*)?$/, {
    body: {
      data: {
        id: "u2",
        email: "admin@wk.test",
        displayName: "Amina Admin",
        role: "admin",
        agencyRole: "admin",
      },
    },
  });
  cy.intercept("GET", /\/api\/auth\/pats(\?.*)?$/, { body: { data: [] } });
  cy.intercept("GET", /\/api\/alerts\/bell(\?.*)?$/, { fixture: "bell.json" });
  cy.intercept("GET", /\/api\/overview(\?.*)?$/, { fixture: "overview.json" });
  cy.intercept("GET", /\/api\/clients(\?.*)?$/, { fixture: "walker-clients.json" });
  cy.intercept("GET", /\/api\/clients\/[^/]+\/ad-accounts(\?.*)?$/, {
    fixture: "walker-ad-accounts.json",
  });
  cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/campaigns(\?.*)?$/, {
    fixture: "walker-campaigns.json",
  });
  cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/campaigns\/[^/?]+/, {
    fixture: "walker-campaign-detail.json",
  });
  cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ad-sets(\?.*)?$/, { fixture: "ad-sets.json" });
  cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ads(\?.*)?$/, { fixture: "ads.json" });
  cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/fatigue-summary(\?.*)?$/, {
    fixture: "fatigue-summary.json",
  });
  cy.intercept("GET", /\/api\/clients\/[^/]+\/revenue(\?.*)?$/, { fixture: "walker-revenue.json" });
  cy.intercept("GET", /\/api\/clients\/[^/]+\/revenue-sources(\?.*)?$/, {
    fixture: "walker-revenue-sources.json",
  });
  cy.intercept("GET", /\/api\/alerts(\?.*)?$/, { fixture: "alerts.json" });
  cy.intercept("GET", /\/api\/tasks(\?.*)?$/, { fixture: "tasks.json" });
  cy.intercept("GET", /\/api\/users(\?.*)?$/, { fixture: "users.json" });
  cy.intercept("GET", /\/api\/audit-logs(\?.*)?$/, { fixture: "walker-audit-logs.json" });
  cy.intercept("GET", /\/api\/settings\/retention(\?.*)?$/, {
    body: { data: { rawInsightsDays: 90 } },
  });
  cy.intercept("GET", /\/api\/scheduler\/status(\?.*)?$/, { fixture: "scheduler-status.json" });
  cy.intercept("GET", /\/api\/scheduler\/jobs(\?.*)?$/, { fixture: "scheduler-jobs.json" });
}

function expectHealthyRoute(route: RouteCheck) {
  cy.get("body", { timeout: 15000 }).should(($body) => {
    const crash = $body.find('[data-testid="route-error"]');
    expect(
      crash.length,
      `route-error boundary rendered: ${crash.first().text()}`,
    ).to.eq(0);
    const text = $body[0].innerText;
    const objectAt = text.indexOf("[object ");
    expect(
      objectAt,
      `raw object rendered as text: ${JSON.stringify(text.slice(Math.max(0, objectAt - 60), objectAt + 120))}`,
    ).to.eq(-1);
    const anchor = route.anchor;
    expect(text, "page anchor is missing, page may be blank").to.match(anchor);
  });
  cy.contains(route.anchor).should("be.visible");
}

describe("route walker", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
    stubApi();
  });

  ROUTES.forEach((route) => {
    it(`renders ${route.name} without a route-level crash`, () => {
      cy.visit(route.path);
      expectHealthyRoute(route);
    });
  });
});

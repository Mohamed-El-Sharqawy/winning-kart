describe("client portal workspace access", () => {
  const CLIENT_ID = "cli_nour_test";

  function stubWorkspace() {
    cy.intercept("GET", /\/api\/portal\/client(\?.*)?$/, {
      body: {
        data: {
          id: CLIENT_ID,
          name: "Maison Nour",
          slug: "maison-nour",
          status: "active",
          industry: null,
          displayCurrency: "AED",
          createdAt: "2026-01-05T09:00:00.000Z",
        },
      },
    }).as("portalClient");
    cy.intercept("GET", /\/api\/clients\/[^/]+\/ad-accounts(\?.*)?$/, {
      body: {
        data: [
          {
            id: "act_nour_1",
            name: "Nour Main",
            slug: "nour-main",
            adAccountId: "act_nour_1",
            platform: "meta",
            healthState: "healthy",
            currency: "AED",
            timezone: "UTC",
            lastSyncAt: "2026-08-19T06:00:00.000Z",
            campaignCount: 2,
            tokenType: "system_user",
            tokenExpiresAt: null,
          },
        ],
      },
    }).as("adAccounts");
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/campaigns\/summary(\?.*)?$/, {
      body: {
        data: {
          spend: 1000,
          revenue: 3000,
          purchases: 10,
          roas: 3,
          cpa: 100,
          ctr: 0.02,
          frequency: 1.4,
        },
      },
    });
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/campaigns(\?.*)?$/, {
      body: {
        data: [
          {
            id: "camp_mn_01",
            name: "Ramadan Retargeting",
            status: "ACTIVE",
            objective: "OUTCOME_SALES",
            dailyBudget: "500.00",
            currency: "AED",
            spend: 1000,
            revenue: 3000,
            roas: 3,
            cpa: 100,
            purchases: 10,
            ctr: 0.02,
            frequency: 1.4,
          },
        ],
        meta: { page: 1, pageSize: 25, total: 1 },
      },
    }).as("campaigns");
  }

  beforeEach(() => {
    cy.loginAs("client");
    stubWorkspace();
  });

  it("shows the client sidebar on the portal and links to the campaigns workspace", () => {
    cy.visit("/portal");

    cy.get("nav", { timeout: 15000 }).should("be.visible");
    cy.get("nav").contains("a", "Campaigns", { timeout: 15000 }).should("be.visible");
    cy.get("nav").contains("a", "Ad Sets").should("be.visible");
    cy.get("nav").contains("a", "Creatives").should("be.visible");

    ["Clients", "Alerts & Tasks", "Team & Permissions", "Attribution & Revenue"].forEach(
      (label) => {
        cy.get("nav").contains(label).should("not.exist");
      },
    );

    cy.get("nav").contains("a", "Campaigns").click();
    cy.url({ timeout: 15000 }).should("include", "/clients/maison-nour");
    cy.url().should("include", "tab=campaigns");
    cy.wait("@campaigns", { timeout: 15000 });

    cy.contains("Ramadan Retargeting", { timeout: 15000 }).should("be.visible");
    cy.get("nav[aria-label='Client workspace sections']")
      .contains("Revenue")
      .should("not.exist");
    cy.get("nav[aria-label='Client workspace sections']")
      .contains("Ad Accounts")
      .should("not.exist");
    cy.get("nav[aria-label='Client workspace sections']")
      .contains("Overview")
      .should("not.exist");
    cy.contains("Sync now").should("not.exist");
  });

  it("redirects a client away from another client's workspace", () => {
    cy.visit("/clients/dia-flower?tab=campaigns");

    cy.url({ timeout: 15000 }).should("include", "/portal");
  });

  it("restricts the client to performance tabs only", () => {
    cy.visit("/clients/maison-nour?tab=revenue");

    cy.url({ timeout: 15000 }).should("include", "tab=campaigns");
  });

  it("scopes the API surface for a client session", () => {
    cy.request({
      method: "GET",
      url: "/api/ad-accounts/00000000-0000-0000-0000-000000000000/campaigns",
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403);
    });

    cy.request({ method: "GET", url: "/api/overview", failOnStatusCode: false }).then(
      (response) => {
        expect(response.status).to.eq(403);
      },
    );

    cy.request({ method: "GET", url: "/api/clients", failOnStatusCode: false }).then(
      (response) => {
        expect(response.status).to.eq(403);
      },
    );
  });
});

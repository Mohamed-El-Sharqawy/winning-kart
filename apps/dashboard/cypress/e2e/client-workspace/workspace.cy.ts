describe("client workspace", () => {
  const NOUR_ACCOUNT = {
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
        campaignCount: 0,
        tokenType: "system_user",
        tokenExpiresAt: null,
      },
    ],
  };

  beforeEach(() => {
    cy.loginAs("agency-admin");
  });

  it("navigates from the clients list into the workspace tabs", () => {
    cy.stubClient();
    cy.intercept("GET", /\/api\/clients\/[^/]+\/ad-accounts(\?.*)?$/, {
      body: NOUR_ACCOUNT,
    });
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/campaigns(\?.*)?$/, {
      body: { data: [], meta: { page: 1, pageSize: 25, total: 0 } },
    }).as("campaigns");
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/campaigns\/summary(\?.*)?$/, {
      body: {
        data: {
          spend: 0,
          revenue: 0,
          purchases: 0,
          roas: null,
          cpa: null,
          ctr: null,
          frequency: null,
        },
      },
    });
    cy.intercept("GET", /\/api\/overview(\?.*)?$/, { fixture: "overview.json" });
    cy.intercept("GET", /\/api\/clients\/[^/]+\/overview(\?.*)?$/, {
      fixture: "overview.json",
    });

    cy.visit("/clients");

    cy.contains("a", "Maison Nour", { timeout: 15000 }).click();
    cy.url().should("include", "/clients/maison-nour");

    ["Overview", "Ad Accounts", "Campaigns"].forEach((label) => {
      cy.contains("[role='tab'], a, button", label).should("be.visible");
    });

    cy.contains("[role='tab'], a, button", "Ad Accounts").click();
    cy.url().should("include", "ad-accounts");
    cy.contains("act_nour_1", { timeout: 15000 }).should("be.visible");

    cy.contains("[role='tab'], a, button", "Campaigns").click();
    cy.url().should("include", "campaigns");
    cy.wait("@campaigns").its("request.url").should((url) => {
      expect(url, "server paging defaults").to.contain("page=1");
      expect(url, "server page size default").to.contain("pageSize=25");
      expect(url, "active status default").to.contain("status=active");
    });
    cy.contains(/no active campaigns in this scope/i, { timeout: 15000 }).should("be.visible");
    cy.get("select[aria-label='Status filter']").select("all");
    cy.wait("@campaigns").its("request.url").should("contain", "status=all");
    cy.contains("No campaigns", { timeout: 15000 }).should("be.visible");

    cy.visit("/clients/maison-nour?tab=overview");
    cy.contains("Spend", { timeout: 15000 }).should("be.visible");
    cy.contains("Revenue").should("be.visible");
  });
});

describe("ad sets and creatives empty state", () => {
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
    cy.stubClient();

    cy.intercept("GET", /\/api\/clients\/[^/]+\/ad-accounts(\?.*)?$/, {
      body: NOUR_ACCOUNT,
    });
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ad-sets(\?.*)?$/, {
      body: { data: [], meta: { page: 1, pageSize: 25, total: 0 } },
    });
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ad-sets\/summary(\?.*)?$/, {
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
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ads(\?.*)?$/, {
      body: { data: [], meta: { nextCursor: null } },
    });
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/fatigue-summary(\?.*)?$/, {
      body: {
        data: {
          topCreativeSpendShare: null,
          top3SpendShare: null,
          concentration: null,
          counts: { fatiguing: 0, bleeding: 0, scale: 0, status_anomaly: 0 },
        },
      },
    });
  });

  it("renders the ad sets tab against the empty seeded database without crashing", () => {
    cy.visit("/clients/maison-nour?tab=ad-sets");

    cy.contains(/no active ad sets in this scope/i, { timeout: 15000 }).should("be.visible");
    cy.get("select[aria-label='Status filter']").select("all");
    cy.contains(/no ad sets yet/i, { timeout: 15000 }).should("be.visible");

    cy.get("body").should(($body) => {
      const text = $body.text();
      expect(
        /application error|uncaught|white screen/i.test(text),
        "no crash screen",
      ).to.be.false;
    });
  });

  it("shows the scoped empty state on the creatives tab until the filter widens", () => {
    cy.visit("/clients/maison-nour?tab=creatives");

    cy.contains(/no active creatives in this scope/i, { timeout: 15000 }).should("be.visible");
    cy.get("select[aria-label='Status filter']").select("all");
    cy.contains(/no creatives yet/i, { timeout: 15000 }).should("be.visible");
  });
});

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
      body: { data: [] },
    });
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ads(\?.*)?$/, {
      body: { data: [] },
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

    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text();
      const accountsLoaded = /act_nour_1|act_nour_2/i.test(text);
      const emptyState =
        /no ad sets|no data|nothing yet|no results|get started|0 ad sets/i.test(
          text,
        );
      expect(
        accountsLoaded || emptyState,
        "seeded account list loads or an empty state renders",
      ).to.be.true;
      expect(
        /application error|uncaught|white screen/i.test(text),
        "no crash screen",
      ).to.be.false;
    });
  });

  it("shows the empty creatives state on the creatives tab", () => {
    cy.visit("/clients/maison-nour?tab=creatives");

    cy.contains(/no creatives yet/i, { timeout: 15000 }).should("be.visible");
  });
});

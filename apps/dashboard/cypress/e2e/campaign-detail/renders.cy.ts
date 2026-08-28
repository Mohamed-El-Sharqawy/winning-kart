const CAMPAIGN_NAME = "Profitlab | Creative Testing | ABO | 5/7";

describe("campaign detail rendering", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();
    cy.intercept("GET", /\/api\/clients\/[^/]+\/ad-accounts(\?.*)?$/, {
      fixture: "walker-ad-accounts.json",
    });

    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/campaigns(\?.*)?$/, {
      body: {
        data: [
          {
            id: "camp_render_1",
            name: CAMPAIGN_NAME,
            status: "ACTIVE",
            objective: "OUTCOME_SALES",
            dailyBudget: 650,
            currency: "AED",
            spend: 41260,
            revenue: 132032,
            purchases: 522,
            roas: 3.2,
            cpa: 79.04,
            ctr: 0.0286,
            frequency: 2.8,
          },
        ],
      },
    });
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ads(\?.*)?$/, {
      body: { data: [] },
    });
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/campaigns\/[^/?]+/, {
      fixture: "renders-campaign-detail.json",
    }).as("campaignDetail");
  });

  [1, 2, 3].forEach((attempt) => {
    it(`attempt ${attempt}: renders from campaigns tab without crashing`, () => {
      cy.visit("/clients/maison-nour?tab=campaigns", { timeout: 20000 });
      cy.contains(CAMPAIGN_NAME, { timeout: 20000 }).should("be.visible");
      cy.contains("a,button", CAMPAIGN_NAME).click();
      cy.url({ timeout: 15000 }).should("include", "/campaigns/");
      cy.contains(CAMPAIGN_NAME, { timeout: 15000 }).should("be.visible");
      cy.get("[data-testid='route-error']").should("not.exist");
      cy.get("svg[role='img']").should("exist");
    });
  });
});

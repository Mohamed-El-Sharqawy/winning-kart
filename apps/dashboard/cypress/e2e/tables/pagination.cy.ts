describe("creatives pagination", () => {
  it("paginates 60 creatives at 25 per page", () => {
    const ads = Array.from({ length: 60 }, (_, i) => ({
      id: `ad-${i + 1}`,
      name: `Creative number ${String(i + 1).padStart(2, "0")}`,
      status: "ACTIVE",
      format: "IMAGE",
      thumbnailUrl: null,
      spend: 100 + i,
      roas: 2,
      ctr: 1,
      frequency: 2,
      purchases: 5,
      spendShare: null,
      fatigue: null,
    }));
    cy.loginAs("agency-admin");
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ads(\?.*)?$/, {
      statusCode: 200,
      body: { data: ads },
    }).as("adsPaged");
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/fatigue-summary(\?.*)?$/, {
      statusCode: 200,
      body: {
        data: {
          topCreativeSpendShare: null,
          top3SpendShare: null,
          concentration: null,
          counts: { fatiguing: 0, bleeding: 0, scale: 0, status_anomaly: 0 },
        },
      },
    }).as("fatigue");

    cy.visit("/clients/maison-nour?tab=creatives", { timeout: 15000 });
    cy.wait("@adsPaged");

    cy.contains("of 60", { timeout: 15000 }).should("be.visible");
    cy.get("[data-creative-card], li, article, div")
      .contains("Creative number 60", { timeout: 15000 })
      .should("be.visible");

    cy.contains("button", "Next").click();
    cy.contains("Creative number 35", { timeout: 15000 }).should("be.visible");

    cy.contains("button", "Prev").click();
    cy.contains("Creative number 60", { timeout: 15000 }).should("be.visible");
  });
});

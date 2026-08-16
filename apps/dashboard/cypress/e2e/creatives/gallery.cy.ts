describe("creatives gallery", () => {
  const AD_NAMES = [
    "Ramadan Hero 15s",
    "Iftar Bundle Carousel",
    "Static Offer v2",
    "UGC Twin Pack",
  ];

  const applyFilter = (label: RegExp) => {
    cy.get("body").then(($body) => {
      const $clickable = $body
        .find("button, [role='tab'], a, [role='menuitem'], label")
        .filter((_, el) => label.test((el.textContent || "").trim()));
      if ($clickable.length) {
        cy.wrap($clickable.first()).click();
        return;
      }
      const $option = $body
        .find("select option")
        .filter((_, el) => label.test(el.textContent || ""))
        .first();
      if ($option.length) {
        cy.wrap($option.parent("select")).select($option.val() as string);
      }
    });
  };

  const clearFilter = () => {
    cy.get("body").then(($body) => {
      const $clear = $body
        .find("button, [role='tab'], a")
        .filter((_, el) => /^(all|clear|reset)/i.test((el.textContent || "").trim()));
      if ($clear.length) {
        cy.wrap($clear.first()).click();
        return;
      }
      const $fatiguing = $body
        .find("button, [role='tab'], a, [role='menuitem'], label")
        .filter((_, el) => /fatiguing/i.test(el.textContent || ""));
      if ($fatiguing.length) {
        cy.wrap($fatiguing.first()).click();
      }
    });
  };

  beforeEach(() => {
    cy.loginAs("agency-admin");

    cy.intercept(
      "GET",
      /\/api\/ad-accounts\/[^/]+\/ads(\?.*)?$/,
      { fixture: "ads.json" },
    ).as("ads");
    cy.intercept(
      "GET",
      /\/api\/ad-accounts\/[^/]+\/fatigue-summary/,
      { fixture: "fatigue-summary.json" },
    ).as("fatigueSummary");

    cy.visit("/clients/maison-nour?tab=creatives");
  });

  it("shows concentration risk, four cards, and fatigue/scale filters", () => {
    cy.contains(/concentration risk/i, { timeout: 15000 }).should("be.visible");

    AD_NAMES.forEach((name) => {
      cy.contains(name, { timeout: 15000 }).should("be.visible");
    });

    applyFilter(/fatiguing/i);

    cy.contains(AD_NAMES[0], { timeout: 15000 }).should("be.visible");
    [AD_NAMES[1], AD_NAMES[2], AD_NAMES[3]].forEach((name) => {
      cy.contains(name).should("not.exist");
    });

    clearFilter();

    AD_NAMES.forEach((name) => {
      cy.contains(name, { timeout: 15000 }).should("be.visible");
    });

    applyFilter(/scale/i);

    cy.contains(AD_NAMES[1], { timeout: 15000 }).should("be.visible");
    [AD_NAMES[0], AD_NAMES[2], AD_NAMES[3]].forEach((name) => {
      cy.contains(name).should("not.exist");
    });
  });
});

import adSetsFixture from "../../fixtures/ad-sets.json";
import adsFixture from "../../fixtures/ads.json";

describe("ad set to creatives drill", () => {
  it("drills from an ad set row into filtered creatives", () => {
    cy.loginAs("agency-admin");
    cy.stubClient();
    cy.intercept("GET", /\/api\/clients\/[^/]+\/ad-accounts(\?.*)?$/, {
      fixture: "walker-ad-accounts.json",
    });
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ad-sets(\?.*)?$/, {
      statusCode: 200,
      body: adSetsFixture,
    }).as("adSets");
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ads(\?.*)?$/, {
      statusCode: 200,
      body: adsFixture,
    }).as("ads");

    cy.visit("/clients/maison-nour?tab=ad-sets", { timeout: 15000 });
    cy.wait("@adSets");

    const firstRow = (adSetsFixture as { data: Array<{ name: string }> }).data[0];
    cy.contains("tr,li,[role='row']", firstRow.name, { timeout: 15000 })
      .contains("a,button", "Creatives", { timeout: 15000 })
      .click();

    cy.url({ timeout: 15000 }).should("include", "tab=creatives");
    cy.url().should("include", "adSet=");
    cy.wait("@ads");

    cy.contains(/ad set:/i, { timeout: 15000 }).should("be.visible");

    cy.get("body").then(($body) => {
      const chip = $body.find("button:contains('×')");
      if (chip.length > 0) {
        chip.first().trigger("click");
        cy.url({ timeout: 15000 }).should("not.include", "adSet=");
      }
    });
  });
});

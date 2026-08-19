import adSetsFixture from "../../fixtures/ad-sets.json";

describe("ad sets sorting", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ad-sets(\?.*)?$/, {
      statusCode: 200,
      body: adSetsFixture,
    }).as("adSets");
    cy.visit("/clients/maison-nour?tab=ad-sets", { timeout: 15000 });
    cy.wait("@adSets");
  });

  it("flips row order when clicking the Spend header", () => {
    const rows = (adSetsFixture as { data: Array<{ name: string; spend: number }> }).data;
    const bySpendDesc = [...rows].sort((a, b) => b.spend - a.spend);
    const bySpendAsc = [...bySpendDesc].reverse();

    cy.contains("tr,li,[role='row']", bySpendAsc[0].name, { timeout: 15000 }).should("be.visible");

    cy.contains("th,[role='columnheader']", "Spend", { timeout: 15000 }).click();
    cy.contains("tr,li,[role='row']", bySpendDesc[0].name, { timeout: 15000 }).should("be.visible");
    cy.contains("tr,li,[role='row']", bySpendAsc[0].name).should("not.be.visible");

    cy.contains("th,[role='columnheader']", "Spend").click();
    cy.contains("tr,li,[role='row']", bySpendAsc[0].name, { timeout: 15000 }).should("be.visible");
  });
});

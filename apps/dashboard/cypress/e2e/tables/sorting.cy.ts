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
    const rows = (adSetsFixture as { data: Array<{ name: string }> }).data;
    const bySpendDesc = [...rows].sort((a, b) => b.spend - a.spend);
    const bySpendAsc = [...bySpendDesc].reverse();
    const table = () => cy.contains("table", "Nour Broad - Purchases");

    table().should("be.visible");

    table().contains("button", "Spend").click();
    table().find("tbody tr").first().contains(bySpendDesc[0].name);

    table().contains("button", "Spend").click();
    table().find("tbody tr").first().contains(bySpendAsc[0].name);
  });
});

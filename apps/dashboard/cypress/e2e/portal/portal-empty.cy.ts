describe("client portal empty state", () => {
  beforeEach(() => {
    cy.loginAs("client");
  });

  it("renders /portal with a preparation state or zeroed KPIs instead of crashing", () => {
    cy.visit("/portal");

    cy.url({ timeout: 15000 }).should("include", "/portal");

    cy.contains(/maison nour|portal/i, { timeout: 20000 }).should(
      "be.visible",
    );

    cy.get("body", { timeout: 20000 }).should(($body) => {
      const text = $body.text();
      const preparation =
        /prepar|onboard|no data|not yet|coming soon|setting up|sync/i.test(
          text,
        );
      const zeroedKpis = /(^|[^0-9])0(\.0+)?([^0-9]|$)/.test(text);
      expect(
        preparation || zeroedKpis,
        "preparation empty state or zero KPIs",
      ).to.be.true;
    });
  });
});

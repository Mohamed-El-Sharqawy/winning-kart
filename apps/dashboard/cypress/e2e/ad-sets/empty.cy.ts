describe("ad sets and creatives empty state", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
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

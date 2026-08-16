describe("settings data", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");

    cy.intercept("GET", /\/api\/settings\/retention(\?.*)?$/, {
      body: { data: { rawInsightsDays: 90 } },
    }).as("retentionGet");
  });

  it("shows the retention form and the full export download link", () => {
    cy.visit("/settings/data");

    cy.wait("@retentionGet", { timeout: 20000 });

    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTextInput = /90/.test($body.text());
      const hasInputValue =
        $body
          .find("input")
          .filter((_, el) => (el as HTMLInputElement).value === "90")
          .length > 0;
      expect(
        hasTextInput || hasInputValue,
        "retention form shows 90",
      ).to.be.true;
    });

    cy.contains("a", /download full export/i, { timeout: 15000 })
      .should("be.visible")
      .and("have.attr", "href")
      .and("include", "/api/export/bundle");
  });
});

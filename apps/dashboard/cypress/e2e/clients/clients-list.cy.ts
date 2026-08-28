describe("clients list", () => {
  it("shows the seeded clients", () => {
    cy.loginAs("agency-admin");
    cy.stubClient();
    cy.intercept("GET", /\/api\/clients(\?.*)?$/, {
      body: {
        data: [
          {
            id: "cli_nour_test",
            name: "Maison Nour",
            slug: "maison-nour",
            status: "active",
            displayCurrency: "AED",
            createdAt: "2026-01-05T09:00:00.000Z",
          },
          {
            id: "cli_dune_test",
            name: "Dune Coffee",
            slug: "dune-coffee",
            status: "active",
            displayCurrency: "AED",
            createdAt: "2026-02-05T09:00:00.000Z",
          },
        ],
      },
    });
    cy.visit("/clients");

    cy.contains("Maison Nour").should("be.visible");
    cy.contains("Dune Coffee").should("be.visible");

    cy.get('a[href*="/clients/"]').should("have.length.greaterThan", 0);
  });
});

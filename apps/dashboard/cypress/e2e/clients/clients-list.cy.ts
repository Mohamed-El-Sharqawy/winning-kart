describe("clients list", () => {
  it("shows the seeded clients", () => {
    cy.loginAs("agency-admin");
    cy.visit("/clients");

    cy.contains("Maison Nour").should("be.visible");
    cy.contains("Dune Coffee").should("be.visible");
  });
});

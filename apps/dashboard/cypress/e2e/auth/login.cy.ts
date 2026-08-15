import "./support/commands";

it("signs in with valid agency credentials", () => {
  cy.loginAs("agency-admin");
  cy.visit("/auth");
  cy.contains("Winning Kart").should("be.visible");
});

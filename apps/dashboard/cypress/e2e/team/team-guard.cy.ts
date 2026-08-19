describe("team page access control", () => {
  it("rejects the users API for a client session", () => {
    cy.loginAs("client");

    cy.request({ method: "GET", url: "/api/users", failOnStatusCode: false }).then((response) => {
      expect(response.status).to.eq(403);
    });
  });

  it("redirects a client away from the team page", () => {
    cy.loginAs("client");
    cy.visit("/team");

    cy.url({ timeout: 15000 }).should("include", "/portal");
  });
});

describe("auth login", () => {
  it("signs in with valid admin credentials", () => {
    cy.visit("/auth");
    cy.get('input[type="email"]').type("admin@wk.test");
    cy.get('input[type="password"]').type("demo-pass-123");
    cy.contains("button", "Sign in").click();

    cy.url().should("include", "/overview");
    cy.contains("WINNING KART").should("be.visible");
  });

  it("shows an error and stays on /auth for invalid credentials", () => {
    cy.visit("/auth");
    cy.get('input[type="email"]').type("admin@wk.test");
    cy.get('input[type="password"]').type("not-the-password");
    cy.contains("button", "Sign in").click();

    cy.url().should("include", "/auth");
    cy.contains("Invalid credentials").should("be.visible");
  });
});

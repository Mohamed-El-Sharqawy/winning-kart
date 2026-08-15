Cypress.Commands.add("loginAs", (role: "agency-admin" | "client") => {
  cy.session(role, () => {
    cy.request("POST", "http://localhost:3000/auth/login", {
      email: `${role}@example.test`,
      password: "test-password-123",
    }).then((response) => {
      cy.setCookie("wk_session", response.body.token);
    });
  });
});

Cypress.Commands.add("seedClient", (slug: string) => {
  cy.request("POST", "http://localhost:3000/clients", {
    name: slug,
    slug,
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(role: "agency-admin" | "client"): Chainable<void>;
      seedClient(slug: string): Chainable<void>;
    }
  }
}

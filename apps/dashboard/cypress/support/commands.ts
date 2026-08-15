const ROLE_EMAILS = {
  "agency-admin": "admin@wk.test",
  owner: "owner@wk.test",
  client: "client@maisonnour.test",
} as const;

export type LoginRole = keyof typeof ROLE_EMAILS;

Cypress.Commands.add("loginAs", (role: LoginRole) => {
  cy.session(
    role,
    () => {
      cy.request("POST", "/api/auth/login", {
        email: ROLE_EMAILS[role],
        password: "demo-pass-123",
      });
    },
    { cacheAcrossSpecs: true },
  );
});

Cypress.Commands.add("seedClient", (slug: string) => {
  cy.request("POST", "/api/clients", {
    name: slug,
    slug,
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(role: LoginRole): Chainable<void>;
      seedClient(slug: string): Chainable<void>;
    }
  }
}

export {};

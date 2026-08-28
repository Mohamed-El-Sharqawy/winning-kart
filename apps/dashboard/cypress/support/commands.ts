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

const STUB_CLIENT = {
  id: "cli_nour_test",
  name: "Maison Nour",
  slug: "maison-nour",
  status: "active",
  displayCurrency: "AED",
  createdAt: "2026-01-05T09:00:00.000Z",
};

const STUB_CLIENTS = [
  {
    id: "cli_dia_flower",
    name: "Dia Flower",
    slug: "dia-flower",
    status: "active",
    displayCurrency: "AED",
    createdAt: "2026-06-01T09:00:00.000Z",
  },
  STUB_CLIENT,
];

Cypress.Commands.add("stubClient", () => {
  cy.intercept("GET", /\/api\/clients\/cli_nour_test(\?.*)?$/, {
    body: { data: STUB_CLIENT },
  });
  cy.intercept("GET", /\/api\/clients\/maison-nour(\?.*)?$/, {
    body: { data: STUB_CLIENT },
  });
  cy.intercept("GET", /\/api\/clients(\?.*)?$/, {
    body: { data: STUB_CLIENTS },
  });
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
      stubClient(): Chainable<void>;
      seedClient(slug: string): Chainable<void>;
    }
  }
}

export {};

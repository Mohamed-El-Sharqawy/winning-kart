import { TEAM_MODAL } from "../../support/commands";

const MODAL = TEAM_MODAL;

function pickClient(clientId: string) {
  clientSelect().find(`option[value='${clientId}']`).should("exist");
  clientSelect().select(clientId);
}

function clientSelect() {
  return cy
    .get(MODAL)
    .find("select")
    .filter((_, el) => el.querySelector("option[value='']") !== null);
}

describe("team members client assignment", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();
    cy.intercept("GET", "/api/users*", { fixture: "users.json" }).as("users");
  });

  it("creates a client member with a client assignment", () => {
    cy.intercept("POST", "/api/users", {
      statusCode: 201,
      body: {
        data: {
          id: "u9",
          email: "new@diaflower.client",
          displayName: "New Client",
          role: "client",
          agencyRole: null,
          clientRoleTier: "admin",
          clientId: "cli_nour_test",
          clientName: "Maison Nour",
          status: "active",
          lastActiveAt: null,
          createdAt: "2026-02-10T10:00:00.000Z",
        },
      },
    }).as("createUser");

    cy.visit("/team");
    cy.wait("@users", { timeout: 15000 });

    cy.contains("button", /add member/i, { timeout: 15000 }).click();
    cy.get(MODAL, { timeout: 15000 }).should("be.visible");

    cy.get(MODAL).within(() => {
      cy.contains("label", /name/i).find("input").type("New Client");
      cy.contains("label", /email/i).find("input").type("new@diaflower.client");
      cy.contains("label", /password/i).find("input").type("test-pass-123");
      cy.contains("label", /role/i).find("select").select("client_admin");
    });

    pickClient("cli_nour_test");

    cy.get(MODAL).within(() => {
      cy.contains("button", /add member/i).should("be.enabled").click();
    });

    cy.wait("@createUser", { timeout: 15000 })
      .its("request.body")
      .should((body) => {
        expect(body.role).to.eq("client");
        expect(body.clientRoleTier).to.eq("admin");
        expect(body.clientId).to.eq("cli_nour_test");
      });

    cy.get(MODAL, { timeout: 15000 }).should("not.exist");
  });

  it("assigns a client when editing an unassigned client member", () => {
    cy.intercept("PATCH", "/api/users/*", {
      statusCode: 200,
      body: {
        data: {
          id: "u4",
          email: "admin@diaflower.client",
          displayName: "Testing Client",
          role: "client",
          agencyRole: null,
          clientRoleTier: "admin",
          clientId: "cli_dia_flower",
          clientName: "Dia Flower",
          status: "active",
          lastActiveAt: null,
          createdAt: "2026-01-06T10:00:00.000Z",
        },
      },
    }).as("updateUser");

    cy.visit("/team");
    cy.wait("@users", { timeout: 15000 });

    cy.contains("tr", "Testing Client", { timeout: 15000 })
      .contains("button", /^edit$/i)
      .click();
    cy.get(MODAL, { timeout: 15000 }).should("be.visible");

    pickClient("cli_dia_flower");

    cy.get(MODAL).within(() => {
      cy.contains("button", /save changes/i).click();
    });

    cy.wait("@updateUser", { timeout: 15000 })
      .its("request.body")
      .should((body) => {
        expect(body.role).to.eq("client");
        expect(body.clientId).to.eq("cli_dia_flower");
      });

    cy.get(MODAL, { timeout: 15000 }).should("not.exist");
  });

  it("hides the client picker for agency roles", () => {
    cy.visit("/team");
    cy.wait("@users", { timeout: 15000 });

    cy.contains("tr", "Testing Client", { timeout: 15000 })
      .contains("button", /^edit$/i)
      .click();
    cy.get(MODAL, { timeout: 15000 }).should("be.visible");

    clientSelect().should("exist");
    cy.contains("label", /role/i).find("select").select("analyst");
    clientSelect().should("not.exist");
  });
});

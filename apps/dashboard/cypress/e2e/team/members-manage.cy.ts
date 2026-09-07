describe("team members management", () => {
  const MODAL = "[role='dialog'], dialog, [class*='modal'], [class*='inset-0']";

  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();
    cy.intercept("GET", "/api/users*", { fixture: "users.json" }).as("users");
  });

  it("edits a member from the row actions", () => {
    cy.intercept("PATCH", "/api/users/*", (req) => {
      req.reply({
        statusCode: 200,
        body: {
          data: {
            id: "u2",
            email: "admin@wk.test",
            displayName: "Amina Edited",
            role: "admin",
            agencyRole: "analyst",
            clientRoleTier: null,
            status: "suspended",
            lastActiveAt: null,
            createdAt: "2026-01-03T11:30:00.000Z",
          },
        },
      });
    }).as("updateUser");

    cy.visit("/team");
    cy.wait("@users", { timeout: 15000 });

    cy.contains("tr", "Amina Admin", { timeout: 15000 })
      .contains("button", /^edit$/i)
      .click();
    cy.get(MODAL, { timeout: 15000 }).should("be.visible");

    cy.get(MODAL).within(() => {
      cy.contains("label", /name/i)
        .find("input")
        .clear()
        .type("Amina Edited");
      cy.get("select").eq(0).select("analyst");
      cy.get("select").eq(1).select("suspended");
      cy.contains("button", /save changes/i).click();
    });

    cy.wait("@updateUser", { timeout: 15000 })
      .its("request.body")
      .should((body) => {
        expect(body.displayName).to.eq("Amina Edited");
        expect(body.role).to.eq("admin");
        expect(body.agencyRole).to.eq("analyst");
        expect(body.status).to.eq("suspended");
      });

    cy.get(MODAL, { timeout: 15000 }).should("not.exist");
  });

  it("deletes a member after typing the email", () => {
    cy.intercept("DELETE", "/api/users/*", {
      statusCode: 200,
      body: { data: { ok: true } },
    }).as("deleteUser");

    cy.visit("/team");
    cy.wait("@users", { timeout: 15000 });

    cy.contains("tr", "Nour Client-Admin", { timeout: 15000 })
      .contains("button", /^delete$/i)
      .click();
    cy.get(MODAL, { timeout: 15000 }).should("be.visible");

    cy.get(MODAL).within(() => {
      cy.contains("label", /email/i)
        .find("input")
        .type("client@maisonnour.test");
      cy.contains("button", /delete member/i).click();
    });

    cy.wait("@deleteUser", { timeout: 15000 })
      .its("request.url")
      .should("include", "/api/users/u3");

    cy.get(MODAL, { timeout: 15000 }).should("not.exist");
  });
});

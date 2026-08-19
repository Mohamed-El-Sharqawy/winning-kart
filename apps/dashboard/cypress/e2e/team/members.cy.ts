describe("team members page", () => {
  const createdUser = {
    id: "u9",
    email: "test@wk.test",
    displayName: "Test Person",
    role: "admin",
    agencyRole: "analyst",
    clientRoleTier: null,
    status: "active",
    lastActiveAt": "2026-02-10T10:00:00.000Z",
    createdAt": "2026-02-10T10:00:00.000Z",
  };

  function openAddMemberModal() {
    cy.contains("button", /add member/i, { timeout: 15000 }).click();
    cy.get("[role='dialog'], dialog", { timeout: 15000 }).should("be.visible");
  }

  function fillMemberForm() {
    cy.get("[role='dialog'], dialog").within(() => {
      cy.contains("label", /display name|full name/i)
        .find("input")
        .type("Test Person");
      cy.contains("label", /email/i)
        .find("input")
        .type("test@wk.test");
      cy.contains("label", /password/i)
        .find("input")
        .type("test-pass-123");
    });

    cy.get("[role='dialog'], dialog").then(($dialog) => {
      const select = $dialog.find("select");
      if (select.length) {
        cy.wrap(select.first()).select(/Agency\s*[—-]\s*Analyst/i);
      } else {
        cy.wrap($dialog.first())
          .find("[role='combobox'], button[aria-haspopup='listbox'], button[aria-haspopup='menu']")
          .first()
          .click();
        cy.get("[role='option'], [role='menuitem'], li", { timeout: 15000 })
          .contains(/agency\s*[—-]\s*analyst/i)
          .click();
      }
    });
  }

  function submitMemberForm() {
    cy.get("[role='dialog'], dialog")
      .contains("button", /^(add|create|invite|save|submit|confirm)/i)
      .click();
  }

  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.intercept("GET", "/api/users*", { fixture: "users.json" }).as("users");
  });

  it("lists members with their roles", () => {
    cy.visit("/team");

    cy.contains("Team & Permissions", { timeout: 15000 }).should("be.visible");
    cy.contains("Members", { timeout: 15000 }).should("be.visible");
    cy.wait("@users", { timeout: 15000 });

    ["Captain Owner", "Amina Admin", "Nour Client-Admin"].forEach((name) => {
      cy.contains(name, { timeout: 15000 }).should("be.visible");
    });

    cy.get("tbody tr", { timeout: 15000 }).should("have.length", 3);
    cy.contains(/\bowner\b/i).should("be.visible");
    cy.contains(/client\s*·\s*admin/i).should("be.visible");
  });

  it("creates a member from the add member modal", () => {
    cy.visit("/team");
    cy.wait("@users", { timeout: 15000 });

    openAddMemberModal();
    fillMemberForm();

    cy.intercept("POST", "/api/users", {
      statusCode: 201,
      body: { data: createdUser },
    }).as("createUser");

    submitMemberForm();

    cy.wait("@createUser", { timeout: 15000 })
      .its("request.body")
      .should((body) => {
        expect(body.email).to.eq("test@wk.test");
        expect(body.agencyRole).to.eq("analyst");
      });

    cy.get("[role='dialog'], dialog", { timeout: 15000 }).should("not.exist");
  });

  it("keeps the modal open with an inline problem detail on a 409", () => {
    cy.visit("/team");
    cy.wait("@users", { timeout: 15000 });

    openAddMemberModal();
    fillMemberForm();

    cy.intercept("POST", "/api/users", {
      statusCode: 409,
      headers: { "content-type": "application/problem+json" },
      body: {
        type: "about:blank",
        title: "Conflict",
        status: 409,
        detail: "Email already taken",
        code: "EMAIL_TAKEN",
      },
    }).as("createUser");

    submitMemberForm();

    cy.wait("@createUser", { timeout: 15000 });
    cy.contains("Email already taken", { timeout: 15000 }).should("be.visible");
    cy.get("[role='dialog'], dialog").should("be.visible");
  });
});

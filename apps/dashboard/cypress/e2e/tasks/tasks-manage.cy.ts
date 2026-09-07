describe("tasks management", () => {
  const MODAL = "[role='dialog'], dialog, [class*='modal'], [class*='inset-0']";

  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();

    cy.intercept("GET", /\/api\/insights(\?.*)?$/, { body: { data: [] } });
    cy.intercept("GET", /\/api\/tasks(\?.*)?$/, { fixture: "tasks.json" }).as("tasksGet");
    cy.intercept("GET", /\/api\/alerts(\?.*)?$/, { fixture: "alerts.json" });
    cy.intercept("GET", /\/api\/alerts\/bell(\?.*)?$/, { fixture: "bell.json" });

    cy.visit("/alerts?tab=tasks");
  });

  it("edits a task title and description from the row actions", () => {
    cy.intercept("PATCH", /\/api\/tasks\/[^/?]+(\?.*)?$/, (req) => {
      req.reply({
        statusCode: 200,
        body: { data: { ...req.body, id: "tsk_002" } },
      });
    }).as("tasksPatch");

    cy.contains("Collect UGC assets for Dune launch", { timeout: 15000 })
      .should("be.visible");

    cy.contains("tr", "Collect UGC assets for Dune launch")
      .contains("button", /^edit$/i)
      .click();
    cy.get(MODAL, { timeout: 15000 }).should("be.visible");

    cy.get(MODAL).within(() => {
      cy.contains("label", /title/i)
        .find("input")
        .clear()
        .type("Collect UGC assets and brief the creator");
      cy.contains("label", /description/i)
        .find("input")
        .clear()
        .type("Brief attached in the drive folder");
      cy.contains("button", /save changes/i).click();
    });

    cy.wait("@tasksPatch", { timeout: 15000 })
      .its("request.body")
      .should((body) => {
        expect(body.title).to.eq("Collect UGC assets and brief the creator");
        expect(body.description).to.eq("Brief attached in the drive folder");
      });

    cy.get(MODAL, { timeout: 15000 }).should("not.exist");
  });

  it("deletes a task after confirming", () => {
    cy.intercept("DELETE", /\/api\/tasks\/[^/?]+(\?.*)?$/, {
      statusCode: 200,
      body: { data: { ok: true } },
    }).as("tasksDelete");

    cy.contains("Investigate Summer Editions ROAS drop", { timeout: 15000 }).should(
      "be.visible",
    );

    cy.contains("tr", "Investigate Summer Editions ROAS drop")
      .contains("button", /^delete$/i)
      .click();
    cy.get(MODAL, { timeout: 15000 }).should("be.visible");

    cy.get(MODAL).within(() => {
      cy.contains("button", /delete task/i).click();
    });

    cy.wait("@tasksDelete", { timeout: 15000 })
      .its("request.url")
      .should("include", "/api/tasks/tsk_001");

    cy.get(MODAL, { timeout: 15000 }).should("not.exist");
  });
});

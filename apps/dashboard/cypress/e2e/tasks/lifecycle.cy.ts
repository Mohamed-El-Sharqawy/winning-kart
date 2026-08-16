describe("tasks lifecycle", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");

    cy.intercept("GET", /\/api\/tasks(\?.*)?$/, {
      fixture: "tasks.json",
    }).as("tasksGet");

    cy.intercept("POST", /\/api\/tasks\/?(\?.*)?$/, (req) => {
      req.reply({
        statusCode: 201,
        body: {
          data: { id: "tsk_003", status: "todo", ...req.body },
        },
      });
    }).as("tasksPost");

    cy.intercept("PATCH", /\/api\/tasks\/[^/?]+(\?.*)?$/, (req) => {
      req.reply({
        statusCode: 200,
        body: { data: { ...req.body } },
      });
    }).as("tasksPatch");

    cy.intercept("GET", /\/api\/alerts(\?.*)?$/, { fixture: "alerts.json" });
    cy.intercept("GET", /\/api\/alerts\/bell(\?.*)?$/, {
      fixture: "bell.json",
    });

    cy.visit("/alerts?tab=tasks");
  });

  it("renders the two task rows on the tasks tab", () => {
    cy.wait("@tasksGet");

    cy.contains("Investigate Summer Editions ROAS drop", {
      timeout: 15000,
    }).should("be.visible");
    cy.contains("Collect UGC assets for Dune launch", {
      timeout: 15000,
    }).should("be.visible");
    cy.contains("Amina Admin", { timeout: 15000 }).should("be.visible");
  });

  it("creates a task from the modal and advances a task status", () => {
    cy.contains("Investigate Summer Editions ROAS drop", {
      timeout: 15000,
    }).should("be.visible");

    cy.get("body").then(($body) => {
      const $newTask = $body
        .find("button, a, [role='button']")
        .filter((_, el) =>
          /new task|add task|create task/i.test(el.textContent ?? ""),
        )
        .first();
      cy.wrap($newTask).click();
    });

    cy.get("body", { timeout: 15000 }).should(($body) => {
      const $dialog = $body
        .find("[role='dialog'], dialog, [class*='modal']")
        .filter((_, el) => Cypress.$(el).is(":visible"));
      expect($dialog.length, "new task dialog opens").to.be.greaterThan(0);
    });

    cy.get("body").then(($body) => {
      const $dialog = $body
        .find("[role='dialog'], dialog, [class*='modal']")
        .filter((_, el) => Cypress.$(el).is(":visible"))
        .last();
      const $titled = $dialog
        .find("input, textarea")
        .filter((_, el) => {
          const field = el as HTMLInputElement;
          const hint = `${field.placeholder ?? ""} ${field.name ?? ""} ${field.id ?? ""}`.toLowerCase();
          return (
            /title|task|name/.test(hint) &&
            field.type !== "checkbox" &&
            field.type !== "hidden"
          );
        })
        .first();
      const $field = $titled.length
        ? $titled
        : $dialog
            .find("input[type='text'], input:not([type]), textarea")
            .filter((_, el) => Cypress.$(el).is(":visible"))
            .first();
      cy.wrap($field).type("Refresh creative");
    });

    cy.get("body").then(($body) => {
      const $dialog = $body
        .find("[role='dialog'], dialog, [class*='modal']")
        .filter((_, el) => Cypress.$(el).is(":visible"))
        .last();
      const $submit = $dialog
        .find("button")
        .filter((_, el) => /create|save|add|submit/i.test(el.textContent ?? ""))
        .first();
      cy.wrap($submit).click();
    });

    cy.wait("@tasksPost", { timeout: 15000 }).then((interception) => {
      expect(
        JSON.stringify(interception.request.body),
        "created task carries the typed title",
      ).to.include("Refresh creative");
    });

    cy.get("body", { timeout: 15000 }).should(($body) => {
      const openDialogs = $body
        .find("[role='dialog'], dialog, [class*='modal']")
        .filter((_, el) => Cypress.$(el).is(":visible")).length;
      expect(openDialogs, "dialog closed after submit").to.eq(0);
    });

    cy.get("body", { timeout: 15000 }).then(($body) => {
      const $row = $body
        .find("tr, li, article, [role='row'], [role='listitem'], div")
        .filter((_, el) =>
          /Investigate Summer Editions ROAS drop/.test(el.textContent ?? ""),
        )
        .filter((_, el) => Cypress.$(el).find("button, select").length > 0)
        .last();
      const $advance = $row
        .find("button")
        .filter((_, el) =>
          /start|advance|begin|next|mark|move|in.?progress/i.test(
            el.textContent ?? "",
          ),
        )
        .first();
      if ($advance.length) {
        cy.wrap($advance).click();
      } else {
        const $select = $row.find("select").first();
        const $option = $select
          .find("option")
          .filter((_, el) => /in.?progress/i.test(el.textContent ?? ""))
          .first();
        cy.wrap($select).select(($option.val() as string) || "in_progress");
      }
    });

    cy.wait("@tasksPatch", { timeout: 15000 })
      .its("response.statusCode")
      .should("eq", 200);
  });
});

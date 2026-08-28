describe("add ad account error handling", () => {
  it("surfaces a Meta validation error or wizard progress, never a crash", () => {
    cy.loginAs("agency-admin");
    cy.stubClient();

    cy.intercept("GET", /\/api\/clients\/[^/]+\/ad-accounts(\?.*)?$/, {
      fixture: "walker-ad-accounts.json",
    });
    cy.intercept("POST", /\/api\/(clients\/[^/]+\/)?ad-accounts(\/[^/]*)?(\?.*)?$/, {
      statusCode: 400,
      headers: { "content-type": "application/problem+json" },
      body: {
        type: "about:blank",
        title: "Bad Request",
        status: 400,
        detail: "invalid token: Meta rejected these credentials",
        code: "INVALID_TOKEN",
      },
    });
    cy.intercept("POST", /\/api\/clients\/[^/]+\/ad-accounts(\?.*)?$/, {
      statusCode: 201,
      body: {
        data: {
          id: "act_new_1",
          name: "Test",
          adAccountId: "act_123",
          platform: "meta",
          healthState: "healthy",
          currency: "AED",
          timezone: "UTC",
          lastSyncAt: null,
          campaignCount: 0,
          tokenType: "system_user",
          tokenExpiresAt: null,
        },
      },
    });
    cy.intercept("POST", /\/api\/ad-accounts\/[^/]+\/sync(\?.*)?$/, {
      statusCode: 202,
      body: { data: { runId: "run_err_1" } },
    });
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/sync\/runs\/latest(\?.*)?$/, {
      body: {
        data: {
          id: "run_err_1",
          adAccountId: "act_new_1",
          status: "failed",
          progress: {
            stages: [
              { stage: "account_info", status: "succeeded" },
              { stage: "campaigns", status: "failed", errorClass: "invalid_token" },
            ],
          },
          error: "stage campaigns failed (invalid_token)",
          errorClass: "invalid_token",
          graphCalls: 3,
          createdAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
        },
      },
    });

    cy.visit("/clients/maison-nour?tab=ad-accounts");

    cy.contains("button", "Add ad account").click();
    cy.get("[role='dialog'], dialog").should("be.visible");

    cy.contains("label", /name/i).find("input").type("Test");
    cy.contains("label", /ad account id/i).find("input").type("act_123");
    cy.contains("label", /access token/i).find("textarea").type("EAAtotallyinvalidtoken123456");

    cy.get("[role='dialog'], dialog")
      .contains("button", /^(add|connect|create|save|submit|next|continue)/i)
      .click();

    cy.get("body", { timeout: 30000 }).should(($body) => {
      const text = $body.text();
      const hasError = /invalid token|invalid_token|rejected|unavailable/i.test(text);
      const hasProgress = /validating|verifying|fetching|progress/i.test(text);
      expect(hasError || hasProgress, "shows a validation error or wizard progress").to.be.true;
    });

    cy.get("body").then(($body) => {
      const dialog = $body.find("[role='dialog'], dialog");
      const hasError = /invalid token|invalid_token|rejected|unavailable/i.test($body.text());
      if (dialog.length && hasError) {
        cy.wrap(dialog.first()).should("be.visible");
      } else {
        cy.contains(/validating|verifying|fetching|progress/i).should("be.visible");
      }
    });
  });
});

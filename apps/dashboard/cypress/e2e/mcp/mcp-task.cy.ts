const PAT = "wkpat_demo_hermes_0000000000000000000000000000";

describe("mcp create_task tool", () => {
  it("creates a real task that the agency admin can see", () => {
    cy.request({
      method: "POST",
      url: "/api/mcp",
      headers: { Authorization: `Bearer ${PAT}` },
      body: {
        jsonrpc: "2.0",
        id: 41,
        method: "tools/call",
        params: {
          name: "create_task",
          arguments: { title: "hermes m5 task", priority: "low" },
        },
      },
      timeout: 30000,
    }).then((response) => {
      expect(response.status).to.eq(200);
      const result = response.body.data.result;
      expect(result.content).to.be.an("array").that.is.not.empty;
      expect(result.content[0].type).to.eq("text");
      const created = JSON.parse(result.content[0].text);
      expect(created).to.have.property("id");

      cy.loginAs("agency-admin");

      cy.request({
        method: "GET",
        url: "/api/tasks",
        timeout: 30000,
      }).then((tasksResponse) => {
        expect(tasksResponse.status).to.eq(200);
        const tasks = tasksResponse.body.data;
        expect(tasks).to.be.an("array");
        const match = tasks.find(
          (task: { title: string }) => task.title === "hermes m5 task",
        );
        expect(
          match,
          "mcp-created task appears in the admin task list",
        ).to.not.be.undefined;

        const taskId = String(match?.id ?? created.id);
        cy.request({
          method: "PATCH",
          url: `/api/tasks/${taskId}`,
          body: { status: "skipped" },
          failOnStatusCode: false,
          timeout: 30000,
        }).then((patchResponse) => {
          expect([200, 204, 404]).to.include(patchResponse.status);
        });
      });
    });
  });
});

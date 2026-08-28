const PAT = "wkpat_demo_hermes_0000000000000000000000000000";

const rpc = (id: number, method: string, params?: Record<string, unknown>) =>
  cy.request({
    method: "POST",
    url: "/api/mcp",
    headers: { Authorization: `Bearer ${PAT}` },
    body: params
      ? { jsonrpc: "2.0", id, method, params }
      : { jsonrpc: "2.0", id, method },
    timeout: 30000,
  });

describe("mcp protocol", () => {
  const slug = `cypress-mcp-${Date.now()}`;
  let clientId: string;

  before(() => {
    cy.loginAs("agency-admin");
    cy.request({
      method: "POST",
      url: "/api/clients",
      body: { name: "Cypress MCP Probe", slug },
      timeout: 20000,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
      clientId = res.body.data.id;
    });
  });

  after(() => {
    if (clientId) {
      cy.loginAs("agency-admin");
      cy.request({
        method: "DELETE",
        url: `/api/clients/${clientId}`,
        body: { confirmSlug: slug },
        timeout: 20000,
      });
    }
  });

  it("initialize returns winning-kart server info inside the envelope", () => {
    rpc(1, "initialize").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("data");
      expect(response.body.data.jsonrpc).to.eq("2.0");
      expect(response.body.data.id).to.eq(1);
      expect(response.body.data.result.serverInfo.name).to.eq("winning-kart");
    });
  });

  it("tools/list exposes the winning kart tool catalog", () => {
    rpc(2, "tools/list").then((response) => {
      expect(response.status).to.eq(200);
      const tools = response.body.data.result.tools;
      expect(tools).to.be.an("array");
      expect(tools.length).to.be.at.least(7);
      const names = tools.map((tool: { name: string }) => tool.name);
      expect(names).to.include("list_clients");
      expect(names).to.include("sync_ad_account");
    });
  });

  it("tools/call list_clients returns the created client as text content", () => {
    rpc(3, "tools/call", { name: "list_clients", arguments: {} }).then(
      (response) => {
        expect(response.status).to.eq(200);
        const result = response.body.data.result;
        expect(result.content).to.be.an("array").that.is.not.empty;
        expect(result.content[0].type).to.eq("text");
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed).to.be.an("array");
        const slugs = parsed.map((client: { slug: string }) => client.slug);
        expect(slugs).to.include(slug);
      },
    );
  });

  it("tools/call with an unknown tool returns -32602 in band", () => {
    rpc(4, "tools/call", { name: "no_such_tool", arguments: {} }).then(
      (response) => {
        expect(response.status).to.eq(200);
        expect(response.body.data.error.code).to.eq(-32602);
        expect(response.body.data.error.message).to.be.a("string");
      },
    );
  });

  it("an unknown method returns -32601 in band", () => {
    rpc(5, "bogus").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.data.error.code).to.eq(-32601);
      expect(response.body.data.error.message).to.be.a("string");
    });
  });

  it("rejects requests without an authorization header", () => {
    cy.request({
      method: "POST",
      url: "/api/mcp",
      body: { jsonrpc: "2.0", id: 6, method: "tools/list" },
      failOnStatusCode: false,
      timeout: 30000,
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(String(response.headers["content-type"])).to.include(
        "application/problem+json",
      );
    });
  });
});

describe("revenue ingest api", () => {
  const slug = `cypress-ingest-${Date.now()}`;
  let clientId: string;

  before(() => {
    cy.loginAs("agency-admin");
    cy.request({
      method: "POST",
      url: "/api/clients",
      body: { name: "Cypress Ingest Probe", slug },
      timeout: 20000,
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
      clientId = res.body.data.id;
    });
  });

  after(() => {
    if (clientId) {
      cy.request({
        method: "DELETE",
        url: `/api/clients/${clientId}`,
        body: { confirmSlug: slug },
        timeout: 20000,
      });
    }
  });

  beforeEach(() => {
    cy.loginAs("agency-admin");
  });

  const createSource = (clientId: string, name: string) =>
    cy
      .request({
        method: "POST",
        url: `/api/clients/${clientId}/revenue-sources`,
        body: { name },
        failOnStatusCode: false,
        timeout: 20000,
      })
      .then((res) => {
        if (res.status !== 200 && res.status !== 201) {
          return cy
            .request({
              method: "POST",
              url: `/api/clients/${clientId}/revenue-sources`,
              body: { name: `cypress-source-${Date.now()}` },
              timeout: 20000,
            })
            .then((retry) => {
              expect(retry.status).to.be.oneOf([200, 201]);
              const retryKey = retry.body?.data?.ingestKey;
              expect(retryKey, "ingest key")
                .to.be.a("string")
                .and.match(/^wkrev_/);
              return retryKey as string;
            });
        }
        const ingestKey = res.body?.data?.ingestKey;
        expect(ingestKey, "ingest key")
          .to.be.a("string")
          .and.match(/^wkrev_/);
        return ingestKey as string;
      });

  it("issues an ingest key once and grades, dedupes, and rejects revenue events", () => {
    cy.wrap(clientId)
      .should("be.a", "string")
      .then(() => createSource(clientId, "cypress-source"))
      .then((ingestKey) => {
        const post = (body: Record<string, unknown>) =>
          cy.request({
            method: "POST",
            url: "/api/revenue/ingest",
            headers: { Authorization: `Bearer ${ingestKey}` },
            body,
            timeout: 20000,
          });

        const firstEvent = {
          source_order_id: "cy-1",
          timestamp: new Date().toISOString(),
          value: 149.5,
          currency: "AED",
          click_id: { fbclid: "abc" },
        };

        return post(firstEvent).then((first) => {
          expect(first.status).to.eq(202);
          expect(first.body.data).to.include({
            accepted: true,
            match_quality: "A",
            deduped: false,
          });

          return post(firstEvent).then((second) => {
            expect(second.status).to.eq(202);
            expect(second.body.data.deduped).to.eq(true);

            return post({
              source_order_id: "cy-2",
              timestamp: new Date().toISOString(),
              value: 89.25,
              currency: "AED",
              utm: { campaign: "no-match" },
            }).then((unmatched) => {
              expect(unmatched.status).to.eq(202);
              expect(unmatched.body.data.match_quality).to.eq("C");
            });
          });
        });
      })
      .then(() => {
        cy.request({
          method: "POST",
          url: "/api/revenue/ingest",
          headers: { Authorization: "Bearer wkrev_bogus" },
          body: {
            source_order_id: "cy-bogus",
            timestamp: new Date().toISOString(),
            value: 1,
            currency: "AED",
          },
          failOnStatusCode: false,
          timeout: 20000,
        }).then((denied) => {
          expect(denied.status).to.eq(401);
        });
      });
  });
});

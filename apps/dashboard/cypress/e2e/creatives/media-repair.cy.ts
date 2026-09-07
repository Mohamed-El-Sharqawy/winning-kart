describe("creatives media repair", () => {
  it("repairs a broken thumbnail with a forced media resolve and re-renders the row", () => {
    cy.loginAs("agency-admin");
    cy.stubClient();
    cy.intercept("GET", /\/api\/clients\/[^/]+\/ad-accounts(\?.*)?$/, {
      fixture: "walker-ad-accounts.json",
    });
    cy.intercept("GET", "/media/broken-thumb.jpg", { statusCode: 404 });
    cy.intercept("GET", "/media/fixed-thumb.jpg", {
      statusCode: 200,
      headers: { "content-type": "image/svg+xml" },
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="640"></svg>',
    });
    cy.intercept("POST", /\/api\/ad-accounts\/[^/]+\/ads\/media\/resolve$/, (req) => {
      req.reply({
        data: {
          items: [
            { adId: "ad_image_broken", format: "IMAGE", thumbnailUrl: "/media/fixed-thumb.jpg", videoId: null, carouselCount: null },
          ],
        },
      });
    }).as("mediaResolve");
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ads(\?.*)?$/, {
      body: {
        data: [
          {
            id: "ad_image_broken",
            name: "Static Offer v2",
            status: "ACTIVE",
            format: "IMAGE",
            adSetId: "as_1",
            adSetName: "Ad set one",
            campaignId: "cmp_1",
            campaignName: "Campaign one",
            thumbnailUrl: "/media/broken-thumb.jpg",
            videoId: null,
            carouselCount: null,
            bodyCopy: null,
            metrics: { spend: 200, revenue: 80, purchases: 1, roas: 0.4, cpa: 200, ctr: 0.6, frequency: 3.9 },
            spendShare: 0.1,
            trend: { spend: 0, ctr: null },
            fatigue: null,
          },
        ],
        meta: { nextCursor: null },
      },
    }).as("ads");
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/fatigue-summary(\?.*)?$/, {
      fixture: "fatigue-summary.json",
    });

    cy.visit("/clients/maison-nour?tab=creatives");
    cy.wait("@ads");
    cy.wait("@mediaResolve", { timeout: 15000 }).then((xhr) => {
      expect(xhr.request.body).to.deep.eq({ ids: ["ad_image_broken"], force: true });
    });
    cy.get("img[src='/media/fixed-thumb.jpg']").should("be.visible");
  });
});

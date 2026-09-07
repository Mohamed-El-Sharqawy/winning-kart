interface PagedAd {
  id: string;
  name: string;
  status: string;
  format: string;
  adSetId: string;
  adSetName: string;
  campaignId: string;
  campaignName: string;
  thumbnailUrl: string | null;
  videoId: string | null;
  carouselCount: number | null;
  bodyCopy: string | null;
  metrics: Record<string, number | null> | null;
  spendShare: number | null;
  trend: { spend: number; ctr: number | null };
  fatigue: { flag: string; reason: string } | null;
}

function pagedAd(index: number): PagedAd {
  return {
    id: `ad-${index + 1}`,
    name: `Gallery row ${String(index + 1).padStart(2, "0")}`,
    status: "ACTIVE",
    format: "IMAGE",
    adSetId: "as_1",
    adSetName: "Ad set one",
    campaignId: "cmp_1",
    campaignName: "Campaign one",
    thumbnailUrl: null,
    videoId: null,
    carouselCount: null,
    bodyCopy: null,
    metrics: null,
    spendShare: null,
    trend: { spend: 0, ctr: null },
    fatigue: null,
  };
}

const PAGE_SIZE = 30;
const TOTAL = 75;

function page(cursor: string | null): { data: PagedAd[]; meta: { nextCursor: string | null } } {
  const index = cursor === null ? 0 : Number(cursor);
  const start = index * PAGE_SIZE;
  const count = Math.min(PAGE_SIZE, TOTAL - start);
  return {
    data: Array.from({ length: count }, (_, offset) => pagedAd(start + offset)),
    meta: { nextCursor: start + count >= TOTAL ? null : String(index + 1) },
  };
}

function reachBottom() {
  cy.get("[data-testid='gallery-sentinel']").scrollIntoView({ duration: 400, offset: { top: 320, left: 0 } });
}

describe("creatives infinite scroll", () => {
  it("appends cursor pages while scrolling and stops at the null cursor", () => {
    cy.loginAs("agency-admin");
    cy.stubClient();
    cy.intercept("GET", /\/api\/clients\/[^/]+\/ad-accounts(\?.*)?$/, {
      fixture: "walker-ad-accounts.json",
    });
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ads(\?.*)?$/, (req) => {
      req.reply(page(new URL(req.url).searchParams.get("cursor")));
    }).as("adsPages");
    cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/fatigue-summary(\?.*)?$/, {
      fixture: "fatigue-summary.json",
    });

    cy.visit("/clients/maison-nour?tab=creatives");
    cy.wait("@adsPages");
    cy.get("tbody tr").should("have.length", PAGE_SIZE);
    cy.contains("Gallery row 30").should("be.visible");
    cy.contains("Gallery row 31").should("not.exist");

    reachBottom();
    cy.wait("@adsPages").its("request.url").should("include", "cursor=1");
    cy.get("tbody tr", { timeout: 15000 }).should("have.length", 2 * PAGE_SIZE);

    reachBottom();
    cy.wait("@adsPages").its("request.url").should("include", "cursor=2");
    cy.get("tbody tr", { timeout: 15000 }).should("have.length", TOTAL);
    cy.contains("Gallery row 75").should("be.visible");
    cy.contains("End of results").should("be.visible");
  });
});

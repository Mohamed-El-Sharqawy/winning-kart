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
const SCROLL_ATTEMPTS = 10;
const SCROLL_RETRY_WAIT_MS = 250;

function page(cursor: string | null): { data: PagedAd[]; meta: { nextCursor: string | null } } {
  const index = cursor === null ? 0 : Number(cursor);
  const start = index * PAGE_SIZE;
  const count = Math.min(PAGE_SIZE, TOTAL - start);
  return {
    data: Array.from({ length: count }, (_, offset) => pagedAd(start + offset)),
    meta: { nextCursor: start + count >= TOTAL ? null : String(index + 1) },
  };
}

function loadUntilRows(target: number, attempts = SCROLL_ATTEMPTS) {
  cy.get("tbody tr").then(($rows) => {
    if ($rows.length >= target) return;
    if (attempts === 0) {
      expect($rows.length, `scrolling did not grow the table to ${target} rows`).to.eq(target);
      return;
    }
    cy.scrollTo("bottom", { duration: 200 });
    cy.wait(SCROLL_RETRY_WAIT_MS, { log: false });
    loadUntilRows(target, attempts - 1);
  });
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
    }).as("fatigueSummary");

    cy.visit("/clients/maison-nour?tab=creatives");
    cy.wait("@adsPages");
    cy.wait("@fatigueSummary", { timeout: 20000 });
    cy.get("tbody tr").should("have.length", PAGE_SIZE);
    cy.contains("Gallery row 30").should("be.visible");
    cy.contains("Gallery row 31").should("not.exist");

    loadUntilRows(2 * PAGE_SIZE);
    cy.get("tbody tr", { timeout: 15000 }).should("have.length", 2 * PAGE_SIZE);

    loadUntilRows(TOTAL);
    cy.get("tbody tr", { timeout: 15000 }).should("have.length", TOTAL);
    cy.contains("Gallery row 75").should("be.visible");
    cy.contains("End of results").should("be.visible");

    cy.get("@adsPages.all").then((requests) => {
      const cursors = requests.map((req) => new URL(req.request.url).searchParams.get("cursor"));
      expect(cursors, "one request per page, cursors in order").to.deep.eq([null, "1", "2"]);
    });
  });
});

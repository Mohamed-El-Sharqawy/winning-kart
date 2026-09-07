export interface GalleryAdStub {
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

export function galleryAd(overrides: Partial<GalleryAdStub>): GalleryAdStub {
  return {
    id: "ad_x",
    name: "Ad",
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
    metrics: { spend: 100, revenue: 200, purchases: 4, roas: 2, cpa: 25, ctr: 1, frequency: 2 },
    spendShare: 0.1,
    trend: { spend: 0, ctr: null },
    fatigue: null,
    ...overrides,
  };
}

export const GALLERY_ROWS: GalleryAdStub[] = [
  galleryAd({
    id: "ad_video_1",
    name: "Ramadan Hero 15s",
    format: "VIDEO",
    videoId: "v_nour_101",
    metrics: { spend: 500, revenue: 900, purchases: 6, roas: 1.8, cpa: 83.33, ctr: 1.1, frequency: 5.2 },
    fatigue: { flag: "fatiguing", reason: "Frequency 5.2 with declining ROAS" },
  }),
  galleryAd({
    id: "ad_carousel_1",
    name: "Iftar Bundle Carousel",
    format: "CAROUSEL",
    carouselCount: 4,
    metrics: { spend: 300, revenue: 1400, purchases: 9, roas: 4.7, cpa: 33.33, ctr: 3.4, frequency: 1.4 },
  }),
  galleryAd({
    id: "ad_image_broken",
    name: "Static Offer v2",
    thumbnailUrl: "/media/broken-thumb.jpg",
    metrics: { spend: 200, revenue: 80, purchases: 1, roas: 0.4, cpa: 200, ctr: 0.6, frequency: 3.9 },
  }),
  galleryAd({
    id: "ad_pending_1",
    name: "UGC Twin Pack",
    status: "PENDING_REVIEW",
    metrics: { spend: 90, revenue: 170, purchases: 2, roas: 1.9, cpa: 45, ctr: 1.8, frequency: 1.8 },
  }),
];

export const GALLERY_INACTIVE_ROWS: GalleryAdStub[] = [
  galleryAd({ id: "ad_paused_1", name: "Legacy Pixel Banner", status: "ADSET_PAUSED", metrics: null }),
];

function groupFilter(status: string): (row: GalleryAdStub) => boolean {
  if (status === "all") return () => true;
  if (status === "inactive") return (row) => row.status !== "ACTIVE";
  if (status === "active") return (row) => row.status === "ACTIVE";
  const exact = status.toUpperCase();
  return (row) => row.status === exact;
}

export function stubGallery() {
  cy.intercept("GET", /\/api\/clients\/[^/]+\/ad-accounts(\?.*)?$/, {
    fixture: "walker-ad-accounts.json",
  });
  cy.intercept("POST", /\/api\/ad-accounts\/[^/]+\/ads\/media\/resolve$/, (req) => {
    req.reply({
      data: {
        items: [{ adId: "ad_image_broken", format: "IMAGE", thumbnailUrl: "/media/fixed-thumb.jpg", videoId: null, carouselCount: null }],
      },
    });
  }).as("mediaResolve");
  cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ads\/[^/?]+(\?.*)?$/, (req) => {
    const id = new URL(req.url).pathname.split("/ads/")[1];
    const row = GALLERY_ROWS.find((candidate) => candidate.id === id) ?? GALLERY_INACTIVE_ROWS[0];
    req.reply({
      data: {
        ...row,
        posterUrl: null,
        sourceUrl: null,
        imageUrl: row.format === "VIDEO" ? null : "/media/full-creative.jpg",
        adsManagerUrl: "https://www.facebook.com/adsmanager/manage/campaigns?act=1&selected_ad_ids=2",
        embedUrl: row.videoId === null ? null : "https://www.facebook.com/plugins/video.php?href=x",
      },
    });
  }).as("adDetail");
  cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/ads(\?.*)?$/, (req) => {
    const params = new URL(req.url).searchParams;
    const status = params.get("status") ?? "active";
    let rows = [...GALLERY_ROWS, ...GALLERY_INACTIVE_ROWS].filter(groupFilter(status));
    if (params.get("sort") === "ctr") {
      rows = [GALLERY_ROWS[2], GALLERY_ROWS[0], GALLERY_ROWS[1]];
    }
    req.reply({ data: rows, meta: { nextCursor: null } });
  }).as("ads");
  cy.intercept("GET", /\/api\/ad-accounts\/[^/]+\/fatigue-summary(\?.*)?$/, {
    fixture: "fatigue-summary.json",
  }).as("fatigueSummary");
  cy.intercept("GET", "/media/broken-thumb.jpg", { statusCode: 404 });
  cy.intercept("GET", "/media/fixed-thumb.jpg", {
    statusCode: 200,
    headers: { "content-type": "image/svg+xml" },
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="640"></svg>',
  });
  cy.intercept("GET", "/media/full-creative.jpg", {
    statusCode: 200,
    headers: { "content-type": "image/svg+xml" },
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"></svg>',
  });
}

import { stubGallery } from "../../support/gallery-stubs";

describe("creatives gallery", () => {
  beforeEach(() => {
    cy.loginAs("agency-admin");
    cy.stubClient();
    stubGallery();
    cy.visit("/clients/maison-nour?tab=creatives");
    cy.wait("@ads");
  });

  it("renders active rows by default with carousel chips and a video play control", () => {
    cy.contains("Ramadan Hero 15s").should("be.visible");
    cy.contains("Iftar Bundle Carousel").should("be.visible");
    cy.contains("Static Offer v2").should("be.visible");
    cy.contains("UGC Twin Pack").should("not.exist");
    cy.contains("Legacy Pixel Banner").should("not.exist");
    cy.get("[data-testid='carousel-chip']").contains("1/4").should("be.visible");
    cy.get("button[aria-label='Open Ramadan Hero 15s']").should("be.visible");
  });

  it("filters by an exact status from the optgroup", () => {
    cy.get("select[aria-label='Status filter']").select("pending_review");
    cy.wait("@ads").its("request.url").should("include", "status=pending_review");
    cy.contains("UGC Twin Pack").should("be.visible");
    cy.contains("Ramadan Hero 15s").should("not.exist");
  });

  it("shows the inactive group and every row under All", () => {
    cy.get("select[aria-label='Status filter']").select("inactive");
    cy.wait("@ads");
    cy.contains("Legacy Pixel Banner").should("be.visible");
    cy.contains("UGC Twin Pack").should("be.visible");

    cy.get("select[aria-label='Status filter']").select("all");
    cy.wait("@ads");
    cy.contains("Ramadan Hero 15s").should("be.visible");
  });

  it("sorts by CTR through the server", () => {
    cy.contains("button", "CTR").click();
    cy.wait("@ads").its("request.url").should("include", "sort=ctr");
    cy.get("tbody tr").first().contains("Static Offer v2");
  });

  it("opens the URL-driven drawer from a row and closes it by removing the param", () => {
    cy.contains("tbody tr", "Iftar Bundle Carousel").click();
    cy.url().should("include", "creative=ad_carousel_1");
    cy.wait("@adDetail");
    cy.get("[data-testid='creative-drawer']").should("be.visible");
    cy.contains("Lead card of 4").should("be.visible");
    cy.contains("a", "Open in Ads Manager")
      .should("have.attr", "target", "_blank")
      .and("have.attr", "href")
      .and("include", "adsmanager");
    cy.get("[data-testid='drawer-close']").click();
    cy.url().should("not.include", "creative=");
    cy.get("[data-testid='creative-drawer']").should("not.exist");
  });

  it("closes the drawer with browser Back and keeps the gallery scroll", () => {
    cy.viewport(1280, 480);
    cy.window().then((win) => win.scrollTo(0, 400));
    cy.window().its("scrollY").should("be.greaterThan", 0);
    cy.contains("tbody tr", "Ramadan Hero 15s").click();
    cy.url().should("include", "creative=ad_video_1");
    cy.wait("@adDetail");
    cy.go("back");
    cy.get("[data-testid='creative-drawer']").should("not.exist");
    cy.window().its("scrollY").should("be.greaterThan", 0);
  });

  it("opens the drawer with the keyboard from a focused row", () => {
    cy.contains("tbody tr", "Static Offer v2").focus().type("{enter}");
    cy.url().should("include", "creative=ad_image_broken");
    cy.wait("@adDetail");
    cy.get("[data-testid='creative-drawer']").should("be.visible");
  });

  it("deep links into the drawer with the full ad payload", () => {
    cy.visit("/clients/maison-nour?tab=creatives&creative=ad_video_1");
    cy.wait("@ads");
    cy.wait("@adDetail");
    cy.get("[data-testid='creative-drawer']").should("be.visible");
    cy.contains("Ramadan Hero 15s").should("be.visible");
    cy.get("iframe[src*='plugins/video.php']").should("be.visible");
    cy.contains("Fatiguing").should("be.visible");
    cy.contains("AED 500.00").should("be.visible");
    cy.contains("1.80x").should("be.visible");
  });
});

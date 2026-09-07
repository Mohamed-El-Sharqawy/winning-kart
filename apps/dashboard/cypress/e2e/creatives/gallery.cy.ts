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
    cy.get("button[aria-label='Play Ramadan Hero 15s']").should("be.visible");
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

  it("plays a video in place through the detail fetch", () => {
    cy.get("button[aria-label='Play Ramadan Hero 15s']").click();
    cy.wait("@adDetail");
    cy.get("iframe[src*='plugins/video.php']").should("be.visible");
  });
});

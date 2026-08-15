it("authenticates api requests with the demo pat", () => {
  cy.request({
    method: "GET",
    url: "/api/auth/me",
    headers: {
      Authorization: "Bearer wkpat_demo_hermes_0000000000000000000000000000",
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.role).to.eq("admin");
  });
});

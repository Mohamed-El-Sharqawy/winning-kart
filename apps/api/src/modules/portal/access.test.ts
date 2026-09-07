import { describe, expect, test } from "bun:test";
import type { SafeUser } from "../auth/model";
import { requireAdAccountAccess, requireOwnClientAccess } from "./access";
import { memoryAccessModel, portalClientRow } from "./access.fakes";
import { expectProblem } from "../performance/list-fakes";

function user(role: "admin" | "client"): SafeUser {
  return {
    id: "user-1",
    email: "user@wk.test",
    displayName: "User",
    role,
    agencyRole: role === "admin" ? "admin" : null,
    clientRoleTier: role === "client" ? "admin" : null,
    status: "active",
    lastActiveAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

function agencyUser(): SafeUser {
  return user("admin");
}

function clientUser(): SafeUser {
  return user("client");
}

describe("requireAdAccountAccess", () => {
  test("lets agency users through without client lookups", async () => {
    const model = memoryAccessModel();
    await requireAdAccountAccess(agencyUser(), model, "acc-1");
    expect(model.calls.assignedClientFor).toHaveLength(0);
  });

  test("lets a client through when the ad account belongs to their client", async () => {
    const model = memoryAccessModel({
      assignedClient: portalClientRow({ id: "client-1" }),
      adAccountOwners: { "acc-1": "client-1" },
    });
    await requireAdAccountAccess(clientUser(), model, "acc-1");
    expect(model.calls.adAccountOwnerFor).toEqual(["acc-1"]);
  });

  test("rejects a client without a client assignment", async () => {
    const model = memoryAccessModel({ assignedClient: null });
    await expectProblem(
      () => requireAdAccountAccess(clientUser(), model, "acc-1"),
      403,
      "NO_CLIENT_ASSIGNMENT"
    );
  });

  test("rejects a client for an ad account owned by another client", async () => {
    const model = memoryAccessModel({
      assignedClient: portalClientRow({ id: "client-1" }),
      adAccountOwners: { "acc-9": "client-2" },
    });
    await expectProblem(
      () => requireAdAccountAccess(clientUser(), model, "acc-9"),
      403,
      "FORBIDDEN"
    );
  });

  test("rejects a client for an unknown ad account", async () => {
    const model = memoryAccessModel({ assignedClient: portalClientRow() });
    await expectProblem(
      () => requireAdAccountAccess(clientUser(), model, "acc-404"),
      403,
      "FORBIDDEN"
    );
  });
});

describe("requireOwnClientAccess", () => {
  test("lets agency users through without client lookups", async () => {
    const model = memoryAccessModel();
    await requireOwnClientAccess(agencyUser(), model, "client-2");
    expect(model.calls.assignedClientFor).toHaveLength(0);
  });

  test("lets a client through for their own client id", async () => {
    const model = memoryAccessModel({ assignedClient: portalClientRow({ id: "client-1" }) });
    await requireOwnClientAccess(clientUser(), model, "client-1");
  });

  test("rejects a client for another client id", async () => {
    const model = memoryAccessModel({ assignedClient: portalClientRow({ id: "client-1" }) });
    await expectProblem(
      () => requireOwnClientAccess(clientUser(), model, "client-2"),
      403,
      "FORBIDDEN"
    );
  });

  test("rejects a client without a client assignment", async () => {
    const model = memoryAccessModel({ assignedClient: null });
    await expectProblem(
      () => requireOwnClientAccess(clientUser(), model, "client-1"),
      403,
      "NO_CLIENT_ASSIGNMENT"
    );
  });
});

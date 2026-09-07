import type { PortalAccessModel, PortalClientRow } from "./client-ownership";

export function portalClientRow(overrides: Partial<PortalClientRow> = {}): PortalClientRow {
  return {
    id: "client-1",
    name: "Maison Nour",
    slug: "maison-nour",
    status: "active",
    industry: null,
    displayCurrency: "AED",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

export function memoryAccessModel(
  options: {
    assignedClient?: PortalClientRow | null;
    adAccountOwners?: Record<string, string | null>;
  } = {}
): PortalAccessModel & { calls: { assignedClientFor: string[]; adAccountOwnerFor: string[] } } {
  const calls: { assignedClientFor: string[]; adAccountOwnerFor: string[] } = {
    assignedClientFor: [],
    adAccountOwnerFor: [],
  };
  return {
    calls,
    findAssignedClient: async (userId) => {
      calls.assignedClientFor.push(userId);
      return options.assignedClient === undefined ? portalClientRow() : options.assignedClient;
    },
    findClientIdForAdAccount: async (adAccountId) => {
      calls.adAccountOwnerFor.push(adAccountId);
      return options.adAccountOwners?.[adAccountId] ?? null;
    },
  };
}

import { t } from "elysia";

export const createClientDto = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  slug: t.String({ minLength: 1, maxLength: 200 }),
  industry: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  displayCurrency: t.Optional(t.String({ pattern: "^[A-Z]{3}$" })),
});

export const updateClientDto = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  slug: t.Optional(
    t.String({ minLength: 1, maxLength: 200, pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" })
  ),
  industry: t.Optional(t.Union([t.String({ minLength: 1, maxLength: 100 }), t.Null()])),
  status: t.Optional(t.Union([t.Literal("active"), t.Literal("paused"), t.Literal("archived")])),
  displayCurrency: t.Optional(t.String({ pattern: "^[A-Z]{3}$" })),
  assignedAccountManagerUserId: t.Optional(t.Union([t.String(), t.Null()])),
  primaryContactUserId: t.Optional(t.Union([t.String(), t.Null()])),
});

export const deleteClientDto = t.Object({
  confirmSlug: t.String({ minLength: 1 }),
});

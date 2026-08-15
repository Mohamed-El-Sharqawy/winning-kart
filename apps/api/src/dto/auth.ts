import { t } from "elysia";

export const loginDto = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
});

export const createPatDto = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
});

export const loginResponseDto = t.Object({
  role: t.Union([t.Literal("admin"), t.Literal("client")]),
});

export const meDto = t.Object({
  id: t.String(),
  email: t.String(),
  displayName: t.String(),
  role: t.Union([t.Literal("admin"), t.Literal("client")]),
  agencyRole: t.Union([t.String(), t.Null()]),
  clientRoleTier: t.Union([t.String(), t.Null()]),
});

export const errorDto = t.Object({
  error: t.String(),
});

export const okDto = t.Object({
  ok: t.Literal(true),
});

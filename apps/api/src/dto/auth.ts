import { t } from "elysia";

export const loginDto = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
});

export const createPatDto = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
});

export const sessionDto = t.Object({
  token: t.String(),
  role: t.Union([t.Literal("admin"), t.Literal("client")]),
});

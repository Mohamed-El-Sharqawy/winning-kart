import { t } from "elysia";

export const createUserDto = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
  displayName: t.String({ minLength: 1 }),
  role: t.Union([t.Literal("admin"), t.Literal("client")]),
  agencyRole: t.Optional(
    t.Union([
      t.Literal("owner"),
      t.Literal("admin"),
      t.Literal("account_manager"),
      t.Literal("marketer"),
      t.Literal("analyst"),
    ])
  ),
  clientRoleTier: t.Optional(t.Union([t.Literal("admin"), t.Literal("viewer")])),
});

export const userDto = t.Object({
  id: t.String(),
  email: t.String(),
  displayName: t.String(),
  role: t.Union([t.Literal("admin"), t.Literal("client")]),
  agencyRole: t.Union([t.String(), t.Null()]),
  clientRoleTier: t.Union([t.String(), t.Null()]),
  status: t.Union([t.Literal("active"), t.Literal("invited"), t.Literal("suspended")]),
  lastActiveAt: t.Optional(t.Union([t.Date(), t.Null()])),
  createdAt: t.Optional(t.Date()),
  updatedAt: t.Optional(t.Date()),
});

export const userListDto = t.Object({
  data: t.Array(userDto),
});

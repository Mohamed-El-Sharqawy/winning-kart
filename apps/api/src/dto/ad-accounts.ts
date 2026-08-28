import { t } from "elysia";

export const tokenTypeDto = t.Optional(
  t.Union([t.Literal("system_user"), t.Literal("user_60d")])
);

export const createAdAccountDto = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  adAccountId: t.String({ pattern: "^act_\\d+$" }),
  accessToken: t.String({ minLength: 20 }),
  tokenType: tokenTypeDto,
});

export const reconnectAdAccountDto = t.Object({
  accessToken: t.String({ minLength: 20 }),
  tokenType: tokenTypeDto,
});

export const deleteAdAccountDto = t.Object({
  confirmSlug: t.String({ minLength: 1 }),
});

export const adAccountCampaignsQueryDto = t.Object({
  days: t.Optional(t.String({ pattern: "^[0-9]+$" })),
  from: t.Optional(t.String()),
  to: t.Optional(t.String()),
});

export const adAccountBackfillDto = t.Object({
  months: t.Optional(t.Number({ default: 12 })),
});

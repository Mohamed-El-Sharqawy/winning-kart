import { t } from "elysia";

export const createAdAccountDto = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  adAccountId: t.String({ pattern: "^act_\\d+$" }),
  accessToken: t.String({ minLength: 20 }),
});

export const reconnectAdAccountDto = t.Object({
  accessToken: t.String({ minLength: 20 }),
});

export const deleteAdAccountDto = t.Object({
  confirmSlug: t.String({ minLength: 1 }),
});

export const adAccountCampaignsQueryDto = t.Object({
  days: t.Optional(t.String({ pattern: "^[0-9]+$" })),
});

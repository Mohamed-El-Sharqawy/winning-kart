import { t } from "elysia";

const nullableString = t.Union([t.String(), t.Null()]);
const nullableNumber = t.Union([t.Number(), t.Null()]);

export const mediaResolveBodyDto = t.Object({
  ids: t.Array(t.String({ minLength: 1 }), { minItems: 1, maxItems: 100 }),
  force: t.Optional(t.Boolean()),
});

export const mediaResolveResponseDto = t.Object({
  data: t.Object({
    items: t.Array(
      t.Object({
        adId: t.String(),
        format: nullableString,
        thumbnailUrl: nullableString,
        videoId: nullableString,
        carouselCount: nullableNumber,
      })
    ),
  }),
});

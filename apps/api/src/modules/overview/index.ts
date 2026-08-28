import { Elysia, t } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { overviewDto } from "../../dto/overview";
import { OverviewModel } from "./model";
import { OverviewService } from "./service";

const service = new OverviewService(new OverviewModel());

export const overviewModule = new Elysia({ prefix: "/overview" }).get(
  "/",
  async ({ query, headers }) => {
    const user = await resolveSessionUser({ cookie: headers.cookie, headers });
    if (!user) {
      throw problem(401, "UNAUTHENTICATED", "Authentication required");
    }
    return { data: await service.overview(query.from, query.to) };
  },
  {
    query: t.Object({
      from: t.Optional(t.String()),
      to: t.Optional(t.String()),
    }),
    response: { 200: overviewDto },
  }
);

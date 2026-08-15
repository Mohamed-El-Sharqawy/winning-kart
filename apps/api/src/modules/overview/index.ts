import { Elysia } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { overviewDto } from "../../dto/overview";
import { OverviewModel } from "./model";
import { OverviewService } from "./service";

const service = new OverviewService(new OverviewModel());

export const overviewModule = new Elysia({ prefix: "/overview" }).get(
  "/",
  async ({ headers }) => {
    const user = await resolveSessionUser({ cookie: headers.cookie, headers });
    if (!user) {
      throw problem(401, "UNAUTHENTICATED", "Authentication required");
    }
    return { data: await service.overview() };
  },
  { response: { 200: overviewDto } }
);

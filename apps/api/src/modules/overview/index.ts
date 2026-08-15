import { Elysia } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { errorDto } from "../../dto/auth";
import { overviewDto } from "../../dto/overview";
import { OverviewModel } from "./model";
import { OverviewService } from "./service";

const service = new OverviewService(new OverviewModel());

export const overviewModule = new Elysia({ prefix: "/overview" }).get(
  "/",
  async ({ headers, set }) => {
    const user = await resolveSessionUser({ cookie: headers.cookie, headers });
    if (!user) {
      set.status = 401;
      return { error: "unauthorized" };
    }
    return service.overview();
  },
  { response: { 200: overviewDto, 401: errorDto } }
);

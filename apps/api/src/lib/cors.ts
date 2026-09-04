import { Elysia } from "elysia";
import { problemResponse, reasonPhrase } from "./problem";

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter((value) => value.length > 0);

export const corsPlugin = new Elysia({ name: "cors" })
  .onRequest(({ set, request }) => {
    const origin = request.headers.get("origin");
    if (!origin || !allowedOrigins.includes(origin)) {
      return;
    }
    set.headers["access-control-allow-origin"] = origin;
    set.headers["access-control-allow-credentials"] = "true";
    set.headers["access-control-allow-headers"] = "content-type,authorization";
    set.headers["access-control-allow-methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
    set.headers.vary = "Origin";
  })
  .options("/*", ({ set, request, path }) => {
    const origin = request.headers.get("origin");
    if (origin && allowedOrigins.includes(origin)) {
      set.status = 204;
      return;
    }
    set.status = 404;
    set.headers["content-type"] = "application/problem+json";
    return problemResponse(
      {
        status: 404,
        code: "NOT_FOUND",
        title: reasonPhrase(404),
        detail: "Route not found",
      },
      path,
    );
  });

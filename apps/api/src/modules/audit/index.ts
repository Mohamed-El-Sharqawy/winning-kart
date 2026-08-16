import { Elysia } from "elysia";
import { resolveSessionUser } from "../../lib/session";
import { problem } from "../../lib/problem";
import { auditLogsQueryDto, auditLogsResponseDto } from "../../dto/audit";
import { AuditModel } from "./model";
import { AuditService } from "./service";
import type { SafeUser } from "../auth/model";

const service = new AuditService(new AuditModel());

async function requireAdmin(headers: Record<string, string | undefined>): Promise<SafeUser> {
  const user = await resolveSessionUser({ cookie: headers.cookie, headers });
  if (!user) {
    throw problem(401, "UNAUTHENTICATED", "Authentication required");
  }
  if (user.role !== "admin") {
    throw problem(403, "FORBIDDEN", "Admin role required");
  }
  return user;
}

export const auditModule = new Elysia({ prefix: "/audit-logs" })
  .get(
    "/",
    async ({ headers, query }) => {
      await requireAdmin(headers);
      return { data: await service.list(query) };
    },
    { query: auditLogsQueryDto, response: { 200: auditLogsResponseDto } }
  )
  .get(
    "/export",
    async ({ headers, query, set }) => {
      await requireAdmin(headers);
      set.headers["content-type"] = "text/csv";
      set.headers["content-disposition"] = 'attachment; filename="audit-logs.csv"';
      return service.exportCsv(query);
    },
    { query: auditLogsQueryDto }
  );

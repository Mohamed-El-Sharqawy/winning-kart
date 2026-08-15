import { SESSION_COOKIE, verifySession } from "./auth";
import { sha256Hex } from "./crypto";
import { AuthModel } from "../modules/auth/model";
import type { SafeUser } from "../modules/auth/model";

export interface SessionInput {
  cookie?: string | null | undefined;
  headers?: Record<string, string | undefined>;
}

const model = new AuthModel();

export async function resolveSessionUser(input: SessionInput): Promise<SafeUser | null> {
  const headers = input.headers ?? {};
  const authorization = headers["authorization"];
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    const pat = authorization.slice("Bearer ".length).trim();
    if (pat.length > 0) {
      const user = await resolvePatUser(pat);
      if (user) {
        return user;
      }
    }
  }
  const sessionToken = extractSessionCookie(input.cookie);
  if (!sessionToken) {
    return null;
  }
  const session = await verifySession(sessionToken);
  if (!session) {
    return null;
  }
  return model.findUserById(session.sub);
}

async function resolvePatUser(pat: string): Promise<SafeUser | null> {
  const token = await model.findActivePatByHash(sha256Hex(pat));
  if (!token) {
    return null;
  }
  const user = await model.findUserById(token.userId);
  if (!user) {
    return null;
  }
  await model.touchPatLastUsed(token.id);
  return user;
}

function extractSessionCookie(cookieHeader: string | null | undefined): string | null {
  if (typeof cookieHeader !== "string" || cookieHeader.length === 0) {
    return null;
  }
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    if (part.slice(0, separator).trim() === SESSION_COOKIE) {
      return part.slice(separator + 1).trim();
    }
  }
  return null;
}

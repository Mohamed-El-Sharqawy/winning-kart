import { jwtVerify, SignJWT } from "jose";

const rawSecret = process.env.JWT_SECRET;
if (rawSecret === undefined || rawSecret.length < 16) {
  throw new Error("JWT_SECRET must be set to at least 16 characters");
}
const secret = new TextEncoder().encode(rawSecret);

export const SESSION_COOKIE = "wk_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionRole = "admin" | "client";

export interface SessionPayload {
  sub: string;
  role: SessionRole;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.sub !== "string" || (payload.role !== "admin" && payload.role !== "client")) {
      return null;
    }
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

import { signSession, verifySession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "../../lib/auth";
import { sha256Hex } from "../../lib/crypto";
import type { AuthModel } from "./model";
import type { Context } from "elysia";

export class AuthService {
  constructor(private model: AuthModel) {}

  async login(email: string, password: string) {
    const user = await this.model.findUserByEmail(email);
    if (!user) return null;
    const valid = await this.model.verifyPassword(user, password);
    if (!valid) return null;
    const token = await signSession({ sub: user.id, role: user.role });
    return { token, role: user.role, cookie: { name: SESSION_COOKIE, value: token, maxAge: SESSION_TTL_SECONDS } };
  }

  async sessionFromHeaders(headers: Context["headers"]) {
    const auth = headers["authorization"];
    if (auth?.startsWith("Bearer ")) {
      const pat = await this.model.findPatByToken(auth.slice(7));
      if (pat) return { sub: pat.userId, role: pat.role };
    }
    const cookie = headers["cookie"] ?? "";
    const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
    if (!match) return null;
    const session = await verifySession(match[1]);
    return session ? { sub: session.sub, role: session.role } : null;
  }

  async createPat(userId: string, name: string) {
    const plaintext = `wkpat_${crypto.randomUUID().replace(/-/g, "")}`;
    const pat = await this.model.insertPat({
      name,
      userId,
      tokenHash: sha256Hex(plaintext),
    });
    return { id: pat.id, name: pat.name, token: plaintext };
  }
}

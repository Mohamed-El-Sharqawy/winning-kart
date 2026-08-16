import { compare } from "bcryptjs";
import { sha256Hex } from "../../lib/crypto";
import type { AuthModel, PatScope } from "./model";

export class AuthService {
  constructor(private model: AuthModel) {}

  async login(email: string, password: string) {
    const user = await this.model.findUserByEmail(email);
    if (!user) {
      return null;
    }
    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      return null;
    }
    return user;
  }

  listPats(userId: string) {
    return this.model.listPats(userId);
  }

  async createPat(userId: string, name: string, scopes: PatScope[] | null) {
    const plaintext = `wkpat_${crypto.randomUUID().replace(/-/g, "")}`;
    const pat = await this.model.insertPat({
      id: crypto.randomUUID(),
      name,
      userId,
      tokenHash: sha256Hex(plaintext),
      scopes,
    });
    return { id: pat.id, name: pat.name, token: plaintext, scopes };
  }

  revokePat(userId: string, id: string) {
    return this.model.revokePatForUser(id, userId);
  }
}

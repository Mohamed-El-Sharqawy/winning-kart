import { compare } from "bcryptjs";
import type { User, Pat } from "@wk/db";

export interface UserWithPassword extends User {
  passwordHash: string;
}

export class AuthModel {
  async findUserByEmail(_email: string): Promise<UserWithPassword | null> {
    throw new Error("AuthModel.findUserByEmail: wire to @wk/db in M0");
  }

  async verifyPassword(user: UserWithPassword, password: string): Promise<boolean> {
    return compare(password, user.passwordHash);
  }

  async findPatByToken(token: string): Promise<{ userId: string; role: "admin" | "client" } | null> {
    void token;
    throw new Error("AuthModel.findPatByToken: wire to @wk/db in M0");
  }

  async insertPat(input: { name: string; userId: string; tokenHash: string }): Promise<Pat> {
    void input;
    throw new Error("AuthModel.insertPat: wire to @wk/db in M0");
  }
}

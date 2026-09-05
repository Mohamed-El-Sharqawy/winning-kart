import type { AdAccount } from "@wk/db";
import { decrypt } from "../../lib/crypto";
import { problem } from "../../lib/problem";
import { getMetaAdapter, MetaError } from "../../platforms/meta";
import { storedRateLimitBlocked } from "../../platforms/meta/rate-limit";
import type { AdPlatformAdapter } from "../../platforms/meta";

export const PENDING_TOKEN_MESSAGE = "access token is pending oauth connection";

export function ensureNotRateLimited(account: AdAccount): void {
  const storedBlock = storedRateLimitBlocked(account.platformPayload);
  if (storedBlock.blocked) {
    const estimate = storedBlock.estClearMin !== null ? ` ~${storedBlock.estClearMin} min` : "";
    throw problem(
      429,
      "RATE_LIMITED",
      `Meta rate limit active; do not retry until the window clears.${estimate}`,
      "rate_limited"
    );
  }
}

export function adapterOrNull(account: AdAccount): AdPlatformAdapter | null {
  if (account.accessTokenEncrypted.startsWith("pending-oauth")) {
    return null;
  }
  try {
    return getMetaAdapter(decrypt(account.accessTokenEncrypted));
  } catch {
    return null;
  }
}

export function pendingTokenProblem(): ReturnType<typeof problem> {
  return problem(422, "INVALID_TOKEN", PENDING_TOKEN_MESSAGE, "invalid_token");
}

export function pendingTokenError(): MetaError {
  return new MetaError("invalid_token", PENDING_TOKEN_MESSAGE);
}

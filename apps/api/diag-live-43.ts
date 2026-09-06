import "./src/env";
import { eq } from "drizzle-orm";
import { adAccounts, db } from "@wk/db";
import { decrypt } from "./src/lib/crypto";

const acct = (await db.select().from(adAccounts).where(eq(adAccounts.id, "5053d446-56d4-4c72-a166-438240f81196")).limit(1))[0];
const token = decrypt(acct.accessTokenEncrypted);
for (const videoId of ["4489160867997724", "1567409811694268", "2044770136406591"]) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${videoId}?fields=source,picture`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = (await res.json()) as Record<string, unknown>;
  console.log(videoId, "status:", res.status, "keys:", Object.keys(body).join(","), body.error ? `error: ${JSON.stringify(body.error).slice(0, 160)}` : `source: ${body.source ? "present" : "ABSENT"} picture: ${body.picture ? "present" : "ABSENT"}`);
}
process.exit(0);

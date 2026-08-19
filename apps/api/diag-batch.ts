import "./src/env";
import { eq } from "drizzle-orm";
import { adAccounts, db } from "@wk/db";
import { decrypt } from "./src/lib/crypto";

async function main() {
  const acct = (
    await db.select().from(adAccounts).where(eq(adAccounts.adAccountId, "act_1007555864490743")).limit(1)
  )[0];
  const token = decrypt(acct.accessTokenEncrypted);
  const url = `https://graph.facebook.com/v21.0/act_${acct.adAccountId.replace("act_", "")}/adcreatives?fields=id,thumbnail_url,image_url,video_id,title,body&limit=100`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  console.log("act adcreatives edge status:", res.status);
  const body = (await res.json()) as { data?: Array<{ id: string }>; error?: unknown };
  console.log("rows on page 1:", body.data?.length ?? 0);
  console.log("first id:", body.data?.[0]?.id);
  console.log("error:", JSON.stringify(body.error ?? null).slice(0, 200));
  const singleUrl = `https://graph.facebook.com/v21.0/1775212053679710?fields=id,thumbnail_url,image_url,video_id,title,body`;
  const res2 = await fetch(singleUrl, { headers: { Authorization: `Bearer ${token}` } });
  console.log("single creative status:", res2.status);
  console.log("body:", JSON.stringify(await res2.json()).slice(0, 600));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

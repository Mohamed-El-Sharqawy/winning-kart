import "./src/env";
import { eq, sql } from "drizzle-orm";
import { adAccounts, db } from "@wk/db";
import { decrypt } from "./src/lib/crypto";

async function main() {
  const acct = (
    await db.select().from(adAccounts).where(eq(adAccounts.adAccountId, "act_1007555864490743")).limit(1)
  )[0];
  console.log("account:", acct?.name, "slug:", acct?.slug);
  const counts = (await db.execute(
    sql`select count(*)::int as total, count(creative_id)::int as with_creative, count(thumbnail_url)::int as with_thumb from ads where ad_set_id in (select id from ad_sets where campaign_id in (select id from campaigns where ad_account_id = ${acct.id}))`
  )) as unknown as Array<{ total: number; with_creative: number; with_thumb: number }>;
  console.log("ads counts:", counts[0]);
  const sample = [] as Array<unknown>;
  void sample;
  const token = decrypt(acct.accessTokenEncrypted);
  const adRow = (await db.execute(
    sql`select a.platform_ad_id, a.creative_id from ads a limit 3`
  )) as unknown as Array<{ platform_ad_id: string; creative_id: string | null }>;
  console.log("sample ads:", adRow);
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${adRow[0].platform_ad_id}?fields=id,name,creative{id,name,thumbnail_url}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log("graph ad status:", res.status);
  console.log("graph ad body:", JSON.stringify(await res.json()).slice(0, 500));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

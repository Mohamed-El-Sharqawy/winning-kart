import postgres from "postgres";
import "./src/env";
import { decrypt } from "./src/lib/crypto";
import { MetaClient } from "./src/platforms/meta/client";

async function main() {
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1 });
  const rows = await sql`select ad_account_id, access_token_encrypted from ad_accounts where id = '5053d446-56d4-4c72-a166-438240f81196'`;
  const token = decrypt(rows[0].access_token_encrypted);
  const client = new MetaClient(token);
  const details = await client.getCreativeDetails(rows[0].ad_account_id);
  const creatives = Object.values(details);
  const withImage = creatives.filter((c) => c.image_url || c.effective_object_store_url).length;
  const withVideoId = creatives.filter((c) => typeof c.video_id === "string" && c.video_id.length > 0);
  console.log(`creatives: ${creatives.length} | image-url: ${withImage} | video_id: ${withVideoId.length}`);
  console.log(`with video_source: ${creatives.filter((c) => c.video_source).length}`);
  if (withVideoId.length > 0) {
    const probe = await (client as unknown as { request: (p: string, q: Record<string, string>) => Promise<unknown> }).request("", {
      ids: withVideoId.slice(0, 3).map((c) => c.video_id as string).join(","),
      fields: "source,picture",
    });
    console.log("video batch probe:", JSON.stringify(probe).slice(0, 500));
  }
  await sql.end();
}

main().catch((error) => {
  console.error("diag failed:", error);
  process.exit(1);
});

import { createHash, randomUUID } from "node:crypto";
import { hashSync } from "bcryptjs";
import { sql } from "drizzle-orm";
import { adAccounts, apiTokens, clients, db, users } from "./index";

const DEMO_PASSWORD = "demo-pass-123";
const HERMES_PAT_PLAINTEXT = "wkpat_demo_hermes_0000000000000000000000000000";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function row(cells: string[], widths: number[]): string {
  return cells
    .map((cell, i) => (i === cells.length - 1 ? cell : cell.padEnd(widths[i] ?? 0)))
    .join("  ");
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const passwordHash = hashSync(DEMO_PASSWORD, 12);

  const ownerUserId = randomUUID();
  const nourAdminUserId = randomUUID();

  const maisonNourId = randomUUID();
  const duneCoffeeId = randomUUID();
  const zaytounId = randomUUID();

  await db.execute(
    sql`truncate table api_tokens, ad_accounts, clients, users cascade`
  );

  await db.insert(users).values([
    {
      id: ownerUserId,
      email: "owner@wk.test",
      passwordHash,
      displayName: "Captain Owner",
      role: "admin",
      agencyRole: "owner",
    },
    {
      id: randomUUID(),
      email: "admin@wk.test",
      passwordHash,
      displayName: "Amina Admin",
      role: "admin",
      agencyRole: "admin",
    },
    {
      id: randomUUID(),
      email: "am@wk.test",
      passwordHash,
      displayName: "Omar AM",
      role: "admin",
      agencyRole: "account_manager",
    },
    {
      id: randomUUID(),
      email: "marketer@wk.test",
      passwordHash,
      displayName: "Mona Marketer",
      role: "admin",
      agencyRole: "marketer",
    },
    {
      id: randomUUID(),
      email: "analyst@wk.test",
      passwordHash,
      displayName: "Ali Analyst",
      role: "admin",
      agencyRole: "analyst",
    },
    {
      id: nourAdminUserId,
      email: "client@maisonnour.test",
      passwordHash,
      displayName: "Nour Client-Admin",
      role: "client",
      clientRoleTier: "admin",
    },
    {
      id: randomUUID(),
      email: "viewer@maisonnour.test",
      passwordHash,
      displayName: "Sara Viewer",
      role: "client",
      clientRoleTier: "viewer",
    },
  ]);

  await db.insert(clients).values([
    {
      id: maisonNourId,
      name: "Maison Nour",
      slug: "maison-nour",
      status: "active",
      industry: "Beauty & Retail",
      primaryContactUserId: nourAdminUserId,
      displayCurrency: "AED",
    },
    {
      id: duneCoffeeId,
      name: "Dune Coffee",
      slug: "dune-coffee",
      status: "active",
      industry: "F&B",
      displayCurrency: "AED",
    },
    {
      id: zaytounId,
      name: "Zaytoun",
      slug: "zaytoun",
      status: "paused",
      industry: "E-commerce",
      displayCurrency: "AED",
    },
  ]);

  await db.insert(adAccounts).values([
    {
      id: randomUUID(),
      clientId: maisonNourId,
      name: "Maison Nour — Main",
      slug: "maison-nour-main",
      adAccountId: "act_nour_1",
      platform: "meta",
      accessTokenEncrypted: "pending-oauth:M1",
      currency: "AED",
      timezone: "Asia/Dubai",
      healthState: "healthy",
    },
    {
      id: randomUUID(),
      clientId: maisonNourId,
      name: "Maison Nour — GCC",
      slug: "maison-nour-gcc",
      adAccountId: "act_nour_2",
      platform: "meta",
      accessTokenEncrypted: "pending-oauth:M1",
      currency: "AED",
      timezone: "Asia/Dubai",
      healthState: "healthy",
    },
    {
      id: randomUUID(),
      clientId: duneCoffeeId,
      name: "Dune Coffee — Main",
      slug: "dune-coffee-main",
      adAccountId: "act_dune_1",
      platform: "meta",
      accessTokenEncrypted: "pending-oauth:M1",
      currency: "AED",
      timezone: "Asia/Dubai",
      healthState: "healthy",
    },
    {
      id: randomUUID(),
      clientId: zaytounId,
      name: "Zaytoun — Main",
      slug: "zaytoun-main",
      adAccountId: "act_zaytoun_1",
      platform: "meta",
      accessTokenEncrypted: "pending-oauth:M1",
      currency: "AED",
      timezone: "Asia/Dubai",
      healthState: "healthy",
    },
  ]);

  await db.insert(apiTokens).values([
    {
      id: randomUUID(),
      name: "Hermes",
      userId: ownerUserId,
      tokenHash: sha256Hex(HERMES_PAT_PLAINTEXT),
    },
  ]);

  console.log("Winning Kart dev seed complete");
  console.log("");
  console.log("users: 7");
  console.log(row(["email", "role", "display name"], [24, 24, 0]));
  console.log(row(["owner@wk.test", "agency owner", "Captain Owner"], [24, 24, 0]));
  console.log(row(["admin@wk.test", "agency admin", "Amina Admin"], [24, 24, 0]));
  console.log(row(["am@wk.test", "agency account_manager", "Omar AM"], [24, 24, 0]));
  console.log(row(["marketer@wk.test", "agency marketer", "Mona Marketer"], [24, 24, 0]));
  console.log(row(["analyst@wk.test", "agency analyst", "Ali Analyst"], [24, 24, 0]));
  console.log(row(["client@maisonnour.test", "client admin", "Nour Client-Admin"], [24, 24, 0]));
  console.log(row(["viewer@maisonnour.test", "client viewer", "Sara Viewer"], [24, 24, 0]));
  console.log("");
  console.log("clients: 3 (displayCurrency AED)");
  console.log(row(["slug", "status", "industry", "name"], [14, 8, 16, 0]));
  console.log(row(["maison-nour", "active", "Beauty & Retail", "Maison Nour"], [14, 8, 16, 0]));
  console.log(row(["dune-coffee", "active", "F&B", "Dune Coffee"], [14, 8, 16, 0]));
  console.log(row(["zaytoun", "paused", "E-commerce", "Zaytoun"], [14, 8, 16, 0]));
  console.log("");
  console.log("ad accounts: 4 (meta, AED, Asia/Dubai, healthy)");
  console.log(row(["ad account", "client", "slug", "name"], [15, 13, 19, 0]));
  console.log(row(["act_nour_1", "maison-nour", "maison-nour-main", "Maison Nour — Main"], [15, 13, 19, 0]));
  console.log(row(["act_nour_2", "maison-nour", "maison-nour-gcc", "Maison Nour — GCC"], [15, 13, 19, 0]));
  console.log(row(["act_dune_1", "dune-coffee", "dune-coffee-main", "Dune Coffee — Main"], [15, 13, 19, 0]));
  console.log(row(["act_zaytoun_1", "zaytoun", "zaytoun-main", "Zaytoun — Main"], [15, 13, 19, 0]));
  console.log("");
  console.log("api tokens: 1 (stored as sha256 hex hash)");
  console.log(`  Hermes PAT for owner@wk.test: ${HERMES_PAT_PLAINTEXT}`);
  console.log("");
  console.log(`login credentials: every demo user password is "${DEMO_PASSWORD}"`);
}

await main();
process.exit(0);

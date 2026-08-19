import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey === null || cachedKey.length !== 32) {
    cachedKey = Buffer.from(process.env.ENCRYPTION_KEY ?? "", "hex");
    if (cachedKey.length !== 32) {
      throw new Error("ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
    }
  }
  return cachedKey;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${data.toString("base64")}`;
}

export function decrypt(envelope: string): string {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = envelope.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("malformed ciphertext envelope");
  }
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

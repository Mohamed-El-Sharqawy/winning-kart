import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseEnvFile(path: string): void {
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, "");
    if (process.env[match[1]] === undefined) {
      process.env[match[1]] = value;
    }
  }
}

for (const candidate of [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../.env"),
  resolve(process.cwd(), "../../.env"),
]) {
  if (existsSync(candidate)) {
    parseEnvFile(candidate);
    break;
  }
}

import { existsSync, unlinkSync } from "node:fs";

const userAgent = process.env.npm_config_user_agent ?? "";

for (const lockfile of ["package-lock.json", "yarn.lock"]) {
  if (existsSync(lockfile)) {
    unlinkSync(lockfile);
  }
}

if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead");
  process.exit(1);
}

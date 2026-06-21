import { cp, mkdir, rm } from "fs/promises";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(repoRoot, "artifacts", "hr-docs", "dist", "public");
const targetDir = path.join(repoRoot, "public");

async function main() {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

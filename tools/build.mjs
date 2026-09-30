import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = join(ROOT, "petualangan_nusa_di_taman_labirin.html");
const OUT = join(ROOT, "dist");

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

await copyFile(SOURCE, join(OUT, "index.html"));
await writeFile(join(OUT, ".nojekyll"), "");

console.log(`Situs siap deploy di ${OUT} (index.html + .nojekyll)`);

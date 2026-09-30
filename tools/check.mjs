import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";
import assert from "node:assert/strict";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PAGE = join(ROOT, "petualangan_nusa_di_taman_labirin.html");

const html = readFileSync(PAGE, "utf8");
const inlineScripts = [
  ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi),
].map((m) => m[1]);

assert.ok(inlineScripts.length > 0, "halaman harus punya minimal satu script inline");

for (const [i, code] of inlineScripts.entries()) {
  new Script(code, { filename: `${basename(PAGE)}#inline-${i + 1}` });
}

const readConst = (name) => {
  const found = html.match(new RegExp(`const ${name} = ([\\s\\S]*?)\\n\\s*\\];`));
  assert.ok(found, `konstanta ${name} tidak ditemukan`);
  return Function(`"use strict"; return ${found[1].replace(/\/\/[^\n]*/g, "")}];`)();
};

const grid = readConst("MAZE_GRID");
const stars = readConst("STAR_LOCATIONS");
const questions = (html.match(/\n\s*q:\s*"/g) ?? []).length;
const answers = (html.match(/correct:\s*\d+/g) ?? []).length;

assert.equal(grid.length, 13, "grid labirin harus 13 baris");
assert.ok(
  grid.every((row) => row.length === 13),
  "setiap baris grid harus 13 kolom",
);
assert.equal(stars.length, 10, "harus ada 10 posisi bintang");
assert.equal(questions, 10, "harus ada 10 soal PAI");
assert.equal(answers, 10, "setiap soal harus punya satu kunci jawaban");
assert.equal(
  new Set(stars.map((s) => `${s.x},${s.y}`)).size,
  stars.length,
  "ada posisi bintang yang sama",
);

for (const star of stars) {
  assert.notEqual(grid[star.y]?.[star.x], 1, `bintang (${star.x},${star.y}) berada di dalam tembok`);
}

const start = { x: 1, y: 1 };
assert.notEqual(grid[start.y]?.[start.x], 1, "titik awal Nusa tertimpa tembok");

const reachable = new Set([`${start.x},${start.y}`]);
const queue = [start];
while (queue.length > 0) {
  const { x, y } = queue.shift();
  for (const [dx, dy] of [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]) {
    const nx = x + dx;
    const ny = y + dy;
    const key = `${nx},${ny}`;
    if (ny < 0 || nx < 0 || ny >= grid.length || nx >= grid[0].length) continue;
    if (grid[ny][nx] === 1 || reachable.has(key)) continue;
    reachable.add(key);
    queue.push({ x: nx, y: ny });
  }
}

for (const star of stars) {
  assert.ok(reachable.has(`${star.x},${star.y}`), `bintang (${star.x},${star.y}) tidak bisa dicapai`);
}

const exits = [];
for (const [y, row] of grid.entries()) {
  for (const [x, value] of row.entries()) {
    if (value === 2) exits.push({ x, y });
  }
}
assert.equal(exits.length, 1, "harus ada tepat satu gerbang keluar");
assert.ok(reachable.has(`${exits[0].x},${exits[0].y}`), "gerbang keluar tidak bisa dicapai");

console.log(
  `PASS ${basename(PAGE)}: ${inlineScripts.length} script inline, grid 13x13, ` +
    `${stars.length} bintang, ${questions} soal, ${reachable.size} sel terjangkau`,
);

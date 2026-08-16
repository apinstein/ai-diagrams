import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(repositoryRoot, "bin", "ai-diagrams.mjs");
const fixtures = join(repositoryRoot, "test", "fixtures");

function run(...args) {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [cli, ...args], (error, stdout, stderr) => {
      if (error) reject(new Error(`${stderr}${stdout}`));
      else resolve({ stdout, stderr });
    });
  });
}

test("prints the renderer-oriented command list", async () => {
  const { stderr } = await run();
  assert.match(stderr, /ai-diagrams mermaid/);
  assert.match(stderr, /ai-diagrams plantuml/);
  assert.match(stderr, /ai-diagrams likec4/);
});

for (const [command, source] of [
  ["mermaid", "simple-flow.mmd"],
  ["plantuml", "simple-sequence.puml"]
]) {
  test(`${command} renders a PNG`, async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), "ai-diagrams-test-"));
    const output = join(outputDirectory, `${command}.png`);
    try {
      await run(command, "--input", join(fixtures, source), "--output", output);
      const png = await readFile(output);
      assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });
}

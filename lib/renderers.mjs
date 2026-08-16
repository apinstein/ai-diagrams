import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { tmpdir } from "node:os";

import { Resvg } from "@resvg/resvg-js";
import * as vizModule from "@viz-js/viz";

const require = createRequire(import.meta.url);
const mermaidConfig = new URL("../config/mermaid.json", import.meta.url);

function run(command, arguments_) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with status ${code}.`));
    });
  });
}

async function newerThan(output, input) {
  try {
    const [outputMetadata, inputMetadata] = await Promise.all([stat(output), stat(input)]);
    return outputMetadata.mtimeMs >= inputMetadata.mtimeMs;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function svgToPng(svgPath, pngPath) {
  const svg = await readFile(svgPath);
  const png = new Resvg(svg, { background: "#ffffff" }).render().asPng();
  await mkdir(dirname(pngPath), { recursive: true });
  await writeFile(pngPath, png);
}

async function renderMermaid(source, svgPath) {
  const mmdc = join(dirname(require.resolve("@mermaid-js/mermaid-cli")), "cli.js");
  await run(process.execPath, [mmdc, "-c", mermaidConfig.pathname, "-i", source, "-o", svgPath]);
}

async function renderPlantUml(source, svgPath) {
  let vizInstancePromise;
  globalThis.Viz = {
    instance: () => (vizInstancePromise ??= vizModule.instance())
  };

  const { checkSyntax, renderSvg } = await import("@plantuml/mcp-js/engine.js");
  const plantUmlSource = await readFile(source, "utf8");
  const syntax = JSON.parse(checkSyntax(plantUmlSource));
  if (!syntax.valid) {
    const location = syntax.errorLineNumber ? `:${syntax.errorLineNumber}` : "";
    throw new Error(`${source}${location}: ${syntax.errorMessage}`);
  }

  const rendered = JSON.parse(await new Promise((resolve) => renderSvg(plantUmlSource, resolve)));
  if (!rendered.valid) {
    const location = rendered.errorLineNumber ? `:${rendered.errorLineNumber}` : "";
    throw new Error(`${source}${location}: ${rendered.errorMessage}`);
  }
  await writeFile(svgPath, rendered.svg);
}

export async function renderLikeC4({ source, output }) {
  const likeC4 = join(dirname(require.resolve("likec4/package.json")), "bin", "likec4.mjs");
  await mkdir(output, { recursive: true });
  await run(process.execPath, [likeC4, "export", "png", "--outdir", output, source]);
  console.log(`Rendered LikeC4 views from ${source} -> ${output}`);
}

export async function renderDiagram({ source, output, force, expectedExtension }) {
  if (expectedExtension && extname(source) !== expectedExtension) {
    throw new Error(`${source} is not a ${expectedExtension} source.`);
  }
  if (!force && (await newerThan(output, source))) return;

  const temporaryDirectory = await mkdtemp(join(tmpdir(), "ai-diagrams-"));
  const svgPath = join(temporaryDirectory, "diagram.svg");
  try {
    switch (extname(source)) {
      case ".mmd":
        await renderMermaid(source, svgPath);
        break;
      case ".puml":
        await renderPlantUml(source, svgPath);
        break;
      default:
        throw new Error(`Unsupported diagram source: ${source}`);
    }
    await svgToPng(svgPath, output);
    console.log(`Rendered ${source} -> ${output}`);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function bytesEqual(first, second) {
  try {
    const [firstBytes, secondBytes] = await Promise.all([readFile(first), readFile(second)]);
    return firstBytes.equals(secondBytes);
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

export async function checkRenderedOutputs({ sources, expectedOutput, actualOutput, outputPath }) {
  const stale = [];
  for (const source of sources) {
    const expected = outputPath(source);
    const actual = expected.replace(expectedOutput, actualOutput);
    if (!(await bytesEqual(expected, actual))) stale.push(expected);
  }
  if (stale.length > 0) {
    throw new Error(`Rendered PNG files are missing or stale:\n${stale.map((path) => `  ${path}`).join("\n")}`);
  }
  console.log("All rendered PNG files are current.");
}

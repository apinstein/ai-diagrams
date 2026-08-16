#!/usr/bin/env node

import { mkdtemp, readdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, extname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { checkRenderedOutputs, renderDiagram, renderLikeC4 } from "../lib/renderers.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

function usage() {
  return `Usage:
  ai-diagrams doctor
  ai-diagrams mermaid --input <file.mmd> --output <file.png> [--force]
  ai-diagrams plantuml --input <file.puml> --output <file.png> [--force]
  ai-diagrams likec4 --source <workspace-or-file> --output <directory>
  ai-diagrams render --source <directory> --output <directory> [--force]
  ai-diagrams check --source <directory> --output <directory>
  ai-diagrams makefile-path

Renderer commands: mermaid, plantuml, likec4.
PNG is the only persisted output; SVG is an internal temporary format for
Mermaid and PlantUML.`;
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) return undefined;
  return args[index + 1];
}

function requireOption(args, name) {
  const value = option(args, name);
  if (!value) throw new Error(`Missing required ${name} option.\n\n${usage()}`);
  return resolve(value);
}

function outputPath(sourceRoot, outputRoot, sourcePath) {
  const extension = extname(sourcePath).slice(1);
  const renderer = extension === "mmd" ? "mermaid" : "plantuml";
  const sourceRelative = relative(sourceRoot, sourcePath);
  return join(outputRoot, renderer, sourceRelative.replace(/\.(mmd|puml)$/u, ".png"));
}

async function diagramSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await diagramSources(entryPath)));
    if (entry.isFile() && [".mmd", ".puml"].includes(extname(entry.name))) result.push(entryPath);
  }
  return result.sort();
}

async function renderAll(sourceRoot, outputRoot, force) {
  const sources = await diagramSources(sourceRoot);
  if (sources.length === 0) {
    console.log(`No Mermaid or PlantUML sources found in ${sourceRoot}.`);
    return [];
  }

  for (const source of sources) {
    await renderDiagram({
      source,
      output: outputPath(sourceRoot, outputRoot, source),
      force
    });
  }
  return sources;
}

async function doctor() {
  const mmdc = join(dirname(require.resolve("@mermaid-js/mermaid-cli")), "cli.js");
  require.resolve("@plantuml/mcp-js/engine.js");
  require.resolve("@resvg/resvg-js");
  require.resolve("@viz-js/viz");
  join(dirname(require.resolve("likec4/package.json")), "bin", "likec4.mjs");
  console.log(`Mermaid CLI: ${mmdc}`);
  console.log("PlantUML JS engine: available");
  console.log("Resvg PNG converter: available");
  console.log("LikeC4 CLI: available (PNG export also requires its Playwright browser)");
}

const [command, ...args] = process.argv.slice(2);

try {
  switch (command) {
    case "doctor":
      await doctor();
      break;
    case "mermaid":
      await renderDiagram({
        source: requireOption(args, "--input"),
        output: requireOption(args, "--output"),
        force: args.includes("--force"),
        expectedExtension: ".mmd"
      });
      break;
    case "plantuml":
      await renderDiagram({
        source: requireOption(args, "--input"),
        output: requireOption(args, "--output"),
        force: args.includes("--force"),
        expectedExtension: ".puml"
      });
      break;
    case "likec4":
      await renderLikeC4({
        source: requireOption(args, "--source"),
        output: requireOption(args, "--output"),
      });
      break;
    case "render":
      await renderAll(requireOption(args, "--source"), requireOption(args, "--output"), args.includes("--force"));
      break;
    case "check": {
      const source = requireOption(args, "--source");
      const output = requireOption(args, "--output");
      const temporaryOutput = await mkdtemp(join(tmpdir(), "ai-diagrams-check-"));
      try {
        const sources = await renderAll(source, temporaryOutput, true);
        await checkRenderedOutputs({
          sources,
          expectedOutput: output,
          actualOutput: temporaryOutput,
          outputPath: (sourcePath) => outputPath(source, output, sourcePath)
        });
      } finally {
        await rm(temporaryOutput, { recursive: true, force: true });
      }
      break;
    }
    case "makefile-path":
      console.log(join(packageRoot, "make", "diagrams.mk"));
      break;
    default:
      console.error(usage());
      process.exitCode = command ? 1 : 0;
  }
} catch (error) {
  console.error(`ai-diagrams: ${error.message}`);
  process.exitCode = 1;
}

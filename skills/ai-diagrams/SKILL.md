---
name: ai-diagrams
description: Render and verify versioned Mermaid, PlantUML, and LikeC4 diagrams as PNG artifacts. Use when creating, changing, reviewing, or validating diagrams-as-code in a project where the ai-diagrams CLI is installed.
---

# AI Diagrams

Use `ai-diagrams` as the renderer of record. Keep source files authoritative
and commit PNG artifacts only; SVG is an internal temporary format for Mermaid
and PlantUML and must not be added to the project.

1. Run `ai-diagrams doctor` before rendering. If the command is unavailable,
   tell the user that visual validation requires the shared renderer and point
   to `https://github.com/apinstein/ai-diagrams` for installation.
2. Use the renderer that matches the source: `ai-diagrams mermaid`,
   `ai-diagrams plantuml`, or `ai-diagrams likec4`.
3. Inspect each generated PNG visually. Correct readability or layout problems
   in source, then render again.
4. Run the project's `diagrams-check` target, or `ai-diagrams check` for a
   Mermaid/PlantUML directory, before claiming PNG artifacts are current.

Store a diagram source with, or in a directory clearly associated with, the
documentation domain that owns it. Do not assume a project has one global
diagram directory. The owning Markdown page must link to the source and embed
the corresponding PNG directly:

```md
[Diagram source](./diagrams/example.mmd)

![Brief, descriptive alt text](./diagrams/rendered/mermaid/example.png)
```

Do not create a standalone Markdown wrapper containing only those two lines;
it adds a navigation hop without explanation. Keep a separate Markdown page
only when it provides substantive analysis or annotations.

When a project uses Make, keep its Makefile configuration-only: declare the
project's source/output paths and include the shared recipes with
`include $(shell ai-diagrams makefile-path)`. Do not copy renderer scripts,
Node dependencies, or rendering recipes into each project.

Use Mermaid for flows, runtime sequences, and state behavior. Use PlantUML for
conventional UML and containment-heavy views. Use LikeC4 for static ownership,
containers, and dependencies. LikeC4 PNG export also requires its Playwright
browser; report that as setup, not source-syntax, failure.

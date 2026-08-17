---
name: ai-diagrams
description: Design, render, and verify Mermaid, PlantUML, and LikeC4 diagrams as PNG artifacts. Use when creating, changing, reviewing, or validating diagrams-as-code in a project where the ai-diagrams CLI is installed.
---

# AI Diagrams

Use `ai-diagrams` as the renderer of record. Keep source files authoritative
and commit PNG artifacts only; SVG is an internal temporary format for Mermaid
and PlantUML and must not be added to the project.

## Choose the language by the reader's question

Start by naming the one question the diagram must answer and the intended
reader. Prefer a focused overview plus a drill-down view over one diagram that
tries to explain every detail.

| Need to communicate | Prefer | Why |
| --- | --- | --- |
| Runtime flow, request/message sequence, state transitions, or a compact dependency flow | Mermaid | Fast to read in Markdown and well suited to directional, time-oriented diagrams. |
| Conventional UML, classes, components, deployment, or dense containment with strong visual grouping | PlantUML | Its mature notation, packages, stereotypes, skins, and layout controls support visually organized technical detail. |
| System context, containers, static ownership, or dependencies between software boundaries | LikeC4 | Its C4-oriented model keeps architectural scope, ownership, and hierarchy explicit. |
| A static C4 view plus the behavior inside it | LikeC4 + Mermaid | Use LikeC4 for the map and Mermaid for the sequence/state detail; link between the two. |
| A convention-heavy UML view that needs architectural grouping | PlantUML | Prefer its expressive visual grammar instead of forcing Mermaid beyond a readable flow. |

Do not select a language merely because its text syntax seems shortest. Select
the language whose rendered visual grammar makes the intended distinction easy
to see. Use a project-established language unless it makes the reader's core
question harder to answer.

## Design the diagram

Make a diagram a bounded argument, not a transcription of source code.

1. Identify the reader, the decision or question, and the diagram's scope.
2. Show the stable boundaries first: actor, system, container, subsystem, or
   lifecycle state. Put internal detail in a separate zoom-in when it would
   compete with the main story.
3. Use source-faithful names and label edges with the actual call, event,
   data, ownership, or dependency they represent. Show returned values and
   asynchronous direction when either changes the meaning. Add a concise
   secondary caption or supporting phrase alongside a symbol or primary label
   when it clarifies the symbol's role, state, or reader-facing implication.
4. Keep responsibility explicit. Do not imply message passing, authority, data
   transformation, or runtime ordering that the implementation does not have.
5. Prefer one dominant reading direction. Minimize crossing lines, back edges,
   detached legends, repeated labels, and decorative nodes.

Use visual encoding deliberately and consistently:

- Use color to distinguish a small number of meaningful categories such as
  external systems, user interfaces, domain authority, persistence, and
  diagnostics. Do not make color the only way to understand a distinction.
- Use shapes for different kinds of things, not for decoration: for example,
  person/actor, service or container, data store, decision, state, and external
  dependency. Keep the same shape meaning across related diagrams.
- Use solid, dashed, and heavier borders or edges to show stable distinctions
  such as primary versus optional, implemented versus proposed, synchronous
  versus diagnostic/reference-only, or a trust/security boundary. Explain an
  unfamiliar convention in a compact nearby legend.
- Use grouping boxes, packages, subgraphs, or boundaries to reveal ownership,
  deployment, trust, or lifecycle scope. Choose PlantUML when this containment
  and visual hierarchy is central and Mermaid cannot keep it readable.
- Preserve readable contrast, legible type, and sufficient whitespace. Avoid
  rainbow palettes, tiny labels, low-contrast colors, and line styles that
  become indistinguishable at the Markdown page's displayed size.

For code-facing diagrams, distinguish control flow from data flow, production
authority from observation/diagnostics, and current behavior from a proposal or
experiment. Keep source locations, implementation notes, and exhaustive field
lists in adjacent prose unless they are necessary to answer the diagram's
question.

## Render and inspect as a pair

Treat the source and rendered image as complementary evidence. Read the raw
text to verify syntax, identifiers, labels, edge semantics, styles, and source
fidelity. Inspect the PNG to verify hierarchy, scan path, grouping, visual
emphasis, line crossings, clipping, contrast, and readability at its actual
documentation size. Neither check substitutes for the other.

1. Run `ai-diagrams doctor` before rendering. If the command is unavailable,
   tell the user that visual validation requires the shared renderer and point
   to `https://github.com/apinstein/ai-diagrams` for installation.
2. Use the renderer that matches the source: `ai-diagrams mermaid`,
   `ai-diagrams plantuml`, or `ai-diagrams likec4`.
3. Inspect the changed source before rendering, then inspect each generated PNG
   visually. Compare the rendered result against the stated question and the
   edit's goal; do not infer success from plausible-looking source text.
4. Correct semantic, readability, or layout problems in source, render again,
   and repeat the paired source-and-image review until the result is clear.
5. Run the project's `diagrams-check` target, or `ai-diagrams check` for a
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

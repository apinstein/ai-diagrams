# AI Diagrams

`ai-diagrams` is a shared local renderer for diagrams-as-code. It discovers
Mermaid (`.mmd`) and PlantUML (`.puml`) sources, renders them through a
temporary SVG, and commits PNG as the reader-facing artifact.

It requires Node.js 20.19 or newer.

## Install and use

Install the renderer globally from this repository (or use it through `npx`
for a single invocation):

```sh
npm install --global git+https://github.com/apinstein/ai-diagrams.git
```

Check the local renderer installation:

```sh
ai-diagrams doctor
```

Render a project's diagrams:

```sh
ai-diagrams mermaid --input docs/architecture/diagrams/flow.mmd --output docs/architecture/diagrams/rendered/mermaid/flow.png
ai-diagrams plantuml --input docs/architecture/diagrams/containers.puml --output docs/architecture/diagrams/rendered/plantuml/containers.png
ai-diagrams likec4 --source docs/architecture/eshift.c4 --output docs/architecture/rendered/likec4
```

For Make-based projects:

```makefile
DIAGRAM_SOURCE := docs/architecture/diagrams
DIAGRAM_OUTPUT := $(DIAGRAM_SOURCE)/rendered
include $(shell ai-diagrams makefile-path)
```

For directory-wide Mermaid and PlantUML rendering, `render` and `check`
regenerate in a temporary directory and compare expected PNG files
byte-for-byte. They leave no persisted SVG files.

The packaged Codex skill is deliberately separate from renderer installation:
install it through the normal Codex skill or plugin workflow. The skill checks
that `ai-diagrams` is on `PATH` before it asks the renderer to work.

## Current scope

Mermaid and PlantUML render through temporary SVG into PNG. LikeC4 invokes its
official PNG exporter directly, which renders each declared view and requires
the Playwright browser used by LikeC4.

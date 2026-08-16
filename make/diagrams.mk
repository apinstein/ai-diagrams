# Consumer configuration:
#   DIAGRAM_SOURCE := docs/architecture/diagrams
#   DIAGRAM_OUTPUT := $(DIAGRAM_SOURCE)/rendered
#   include $(shell ai-diagrams makefile-path)

DIAGRAM_RENDER ?= ai-diagrams
DIAGRAM_SOURCE ?= diagrams
DIAGRAM_OUTPUT ?= $(DIAGRAM_SOURCE)/rendered
LIKEC4_SOURCE ?=
LIKEC4_OUTPUT ?= $(DIAGRAM_OUTPUT)/likec4

.PHONY: diagrams diagrams-check diagram-doctor diagrams-likec4

diagrams:
	@$(DIAGRAM_RENDER) render --source $(DIAGRAM_SOURCE) --output $(DIAGRAM_OUTPUT)

ifneq ($(strip $(LIKEC4_SOURCE)),)
diagrams: diagrams-likec4

diagrams-likec4:
	@$(DIAGRAM_RENDER) likec4 --source $(LIKEC4_SOURCE) --output $(LIKEC4_OUTPUT)
endif

diagrams-check:
	@$(DIAGRAM_RENDER) check --source $(DIAGRAM_SOURCE) --output $(DIAGRAM_OUTPUT)

diagram-doctor:
	@$(DIAGRAM_RENDER) doctor

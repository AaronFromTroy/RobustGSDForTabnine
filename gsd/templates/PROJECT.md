---
version: "1.0.0"
type: "template"
artifact: "PROJECT"
schema: "gsd-project-v1"
variables:
  - projectName
  - createdDate
  - coreValue
  - description
  - context
  - constraints
---

# ${projectName}

**Created:** ${createdDate}
**Version:** 1.0.0

## What This Is

${description}

## Core Value

${coreValue}

## Requirements

### Validated

(None yet — ship to validate)

### Active

${requirements}

### Out of Scope

${outOfScope}

## Context

${context}

## Constraints

${constraints}

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| (To be populated during project execution) | | |

---
*Last updated: ${createdDate} after initialization*

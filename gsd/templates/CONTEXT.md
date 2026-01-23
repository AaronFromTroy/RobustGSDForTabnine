---
version: "1.0.0"
type: "template"
artifact: "CONTEXT"
schema: "gsd-context-v1"
variables:
  - phase
  - phase_name
  - gathered
  - status
  - discussion_type
  - phase_boundary
  - locked_decisions
  - discretion_items
  - specifics_content
  - deferred_items
---

---
phase: ${phase}
phase_name: "${phase_name}"
gathered: "${gathered}"
status: "${status}"
discussion_type: "${discussion_type}"
---

# Phase ${phase}: ${phase_name} - Context

**Gathered:** ${gathered}
**Status:** ${status}

<domain>
## Phase Boundary

${phase_boundary}

</domain>

<decisions>
## Implementation Decisions

User's locked-in choices that constrain research and planning.

### Technology & Architecture

${locked_decisions}

### Claude's Discretion

Areas where Claude has freedom to choose:

${discretion_items}

</decisions>

<specifics>
## Specific Ideas

Implementation details and preferences gathered from discussion.

${specifics_content}

</specifics>

<deferred>
## Deferred Ideas

Ideas explicitly marked as out-of-scope for this phase.

${deferred_items}

</deferred>

---

*Phase: ${phase_name}*
*Context gathered: ${gathered}*

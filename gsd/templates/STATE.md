---
version: "1.0.0"
type: "template"
artifact: "STATE"
schema: "gsd-state-v1"
variables:
  - projectName
  - lastUpdated
  - version
  - coreValue
  - currentFocus
  - currentPhase
  - currentPlan
  - status
  - currentStep
  - progressIndicator
  - totalPhases
  - completedPhases
  - totalRequirements
  - validatedRequirements
  - successRate
  - keyDecisions
  - activeTodos
  - knownBlockers
  - recentChanges
  - lastAction
  - nextAction
  - contextNeeded
  - resumeInstructions
---

# State: ${projectName}

**Last Updated:** ${lastUpdated}
**Version:** ${version}

---

## Project Reference

**Core Value:** ${coreValue}

**Current Focus:** ${currentFocus}

---

## Current Position

**Phase:** ${currentPhase}
**Plan:** ${currentPlan}
**Status:** ${status}
**Step:** ${currentStep}

**Progress:** ${progressIndicator}

---

## Performance Metrics

**Phases Completed:** ${completedPhases}/${totalPhases}
**Requirements Validated:** ${validatedRequirements}/${totalRequirements}
**Success Rate:** ${successRate}

---

## Accumulated Context

### Key Decisions

${keyDecisions}

### Active TODOs

${activeTodos}

### Known Blockers

${knownBlockers}

### Recent Changes

${recentChanges}

---

## Session Continuity

**Last Action:** ${lastAction}
**Next Action:** ${nextAction}
**Context Needed:** ${contextNeeded}

**Resume Instructions:**
${resumeInstructions}

---

*State tracking initialized: ${lastUpdated}*

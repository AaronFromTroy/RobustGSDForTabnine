---
version: "1.0.0"
type: "template"
artifact: "ROADMAP"
schema: "gsd-roadmap-v1"
variables:
  - projectName
  - projectDescription
  - createdDate
  - depth
  - phaseCount
  - totalRequirements
  - totalSuccessCriteria
  - overview
  - phasesContent
  - progressTable
  - dependencyGraph
  - riskMitigation
---

# Roadmap: ${projectName}

**Project:** ${projectDescription}
**Created:** ${createdDate}
**Depth:** ${depth} (${phaseCount} phases)
**Coverage:** ${totalRequirements} requirements mapped

## Overview

${overview}

## Phases

${phasesContent}

## Progress

| Phase | Status | Requirements | Success Criteria |
|-------|--------|--------------|------------------|
${progressTable}

**Total:** ${phaseCount} phases, ${totalRequirements} requirements, ${totalSuccessCriteria} success criteria

---

## Dependencies

${dependencyGraph}

---

## Risk Mitigation

${riskMitigation}

---

*Roadmap created: ${createdDate}*
*Next: Plan and execute phases sequentially*

---
version: "1.0.0"
type: "template"
artifact: "REQUIREMENTS"
schema: "gsd-requirements-v1"
variables:
  - projectName
  - createdDate
  - coreValue
  - requirementCategories
---

# Requirements: ${projectName}

**Defined:** ${createdDate}
**Core Value:** ${coreValue}

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

${requirementCategories}

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

${v2Requirements}

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

${outOfScope}

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
${traceabilityTable}

**Coverage:**
- v1 requirements: ${totalRequirements} total
- Mapped to phases: ${mappedRequirements} ✓
- Unmapped: ${unmappedRequirements}

---
*Requirements defined: ${createdDate}*
*Last updated: ${updatedDate}*

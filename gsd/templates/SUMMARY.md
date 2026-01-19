---
version: "1.0.0"
type: "research"
artifact: "SUMMARY"
schema: "gsd-research-v1"
topic: "${topic}"
generated: "${timestamp}"
total_sources: ${totalSources}
variables:
  - topic
  - timestamp
  - totalSources
  - executiveSummary
  - keyFindings
  - roadmapImplications
  - nextSteps
  - sourceList
---

# Research Executive Summary: ${topic}

**Generated:** ${timestamp}
**Total Sources:** ${totalSources}

## Executive Summary

${executiveSummary}

## Key Findings

${keyFindings.map(f => `
### ${f.category}

${f.content}

**Confidence:** ${f.confidence}
**Sources:** ${f.sourceCount}
`).join('\n')}

## Roadmap Implications

${roadmapImplications}

## Next Steps

${nextSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

## Sources

${sourceList}

---
*Research synthesized on ${timestamp}*

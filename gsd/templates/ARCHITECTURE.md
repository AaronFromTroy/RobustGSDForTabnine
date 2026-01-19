---
version: "1.0.0"
type: "research"
artifact: "ARCHITECTURE"
schema: "gsd-research-v1"
topic: "${topic}"
generated: "${timestamp}"
confidence:
  high: ${highCount}
  medium: ${mediumCount}
  low: ${lowCount}
variables:
  - topic
  - timestamp
  - highCount
  - mediumCount
  - lowCount
  - highFindings
  - mediumFindings
  - lowFindings
  - recommendedPatterns
  - antiPatterns
  - sourceList
---

# Architecture Patterns Research: ${topic}

**Generated:** ${timestamp}
**Total Sources:** ${totalSources}

## Summary

${summary}

## High Confidence Findings

${highFindings.map(f => `
### ${f.title}
**Source:** [${f.sourceTitle || f.source}](${f.source})
**Confidence:** HIGH

${f.content}
`).join('\n')}

## Medium Confidence Findings

${mediumFindings.map(f => `
### ${f.title}
**Source:** [${f.sourceTitle || f.source}](${f.source})
**Confidence:** MEDIUM

${f.content}
`).join('\n')}

## Low Confidence Findings

**⚠️ The following findings need validation with official sources:**

${lowFindings.map(f => `
### ${f.title}
**Source:** [${f.sourceTitle || f.source}](${f.source})
**Confidence:** LOW

${f.content}
`).join('\n')}

## Recommended Patterns

${recommendedPatterns}

## Anti-Patterns

${antiPatterns}

## Sources

${sourceList}

---
*Research synthesized on ${timestamp}*

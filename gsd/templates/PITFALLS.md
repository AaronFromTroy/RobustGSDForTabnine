---
version: "1.0.0"
type: "research"
artifact: "PITFALLS"
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
  - howToAvoid
  - sourceList
---

# Common Pitfalls Research: ${topic}

**Generated:** ${timestamp}
**Total Sources:** ${totalSources}

## Summary

${summary}

## High Confidence Findings

${highFindings.map(f => `
### ${f.title}
**Source:** [${f.sourceTitle || f.source}](${f.source})
**Confidence:** HIGH

**Warning Signs:**
${f.warningSigns || 'Not specified'}

**Impact:**
${f.impact || f.content}

**Remediation:**
${f.remediation || 'See documentation'}
`).join('\n')}

## Medium Confidence Findings

${mediumFindings.map(f => `
### ${f.title}
**Source:** [${f.sourceTitle || f.source}](${f.source})
**Confidence:** MEDIUM

**Warning Signs:**
${f.warningSigns || 'Not specified'}

**Impact:**
${f.impact || f.content}

**Remediation:**
${f.remediation || 'See documentation'}
`).join('\n')}

## Low Confidence Findings

**⚠️ The following findings need validation with official sources:**

${lowFindings.map(f => `
### ${f.title}
**Source:** [${f.sourceTitle || f.source}](${f.source})
**Confidence:** LOW

**Warning Signs:**
${f.warningSigns || 'Not specified'}

**Impact:**
${f.impact || f.content}

**Remediation:**
${f.remediation || 'See documentation'}
`).join('\n')}

## How to Avoid

${howToAvoid}

## Sources

${sourceList}

---
*Research synthesized on ${timestamp}*

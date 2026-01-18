---
version: "1.0.0"
type: "template"
artifact: "PLAN"
schema: "gsd-plan-v1"
variables:
  - phaseName
  - planNumber
  - planType
  - wave
  - dependsOn
  - filesModified
  - autonomous
  - userSetupSection
  - objective
  - purpose
  - output
  - executionContext
  - contextReferences
  - tasksContent
  - verificationCriteria
  - successCriteria
---

---
phase: ${phaseName}
plan: ${planNumber}
type: ${planType}
wave: ${wave}
depends_on: ${dependsOn}
files_modified: ${filesModified}
autonomous: ${autonomous}
${userSetupSection}
---

<objective>
${objective}

**Purpose:** ${purpose}

**Output:** ${output}
</objective>

<execution_context>
${executionContext}
</execution_context>

<context>
${contextReferences}
</context>

<tasks>

${tasksContent}

</tasks>

<verification>
${verificationCriteria}
</verification>

<success_criteria>
${successCriteria}
</success_criteria>

<output>
After completion, create \`.planning/phases/${phaseName}/${phaseName}-${planNumber}-SUMMARY.md\` documenting:
- Tasks completed
- Deliverables created
- Any deviations from plan
- Next steps
</output>

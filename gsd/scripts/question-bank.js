/**
 * Question Bank Module
 * Adaptive question taxonomy for phase planning discussions
 *
 * Provides phase-type detection and progressive questioning for:
 * - Technical phases (infrastructure, backend, API)
 * - Design phases (UI, frontend, dashboard, components)
 * - Workflow phases (orchestration, automation, tooling)
 *
 * Questions are organized as:
 * - Essential: Always ask, required for informed planning
 * - Follow-up: Conditional questions based on essential answers
 *
 * Pattern follows research-synthesizer.js (ESM, JSDoc, async-ready)
 */

/**
 * Question taxonomy organized by phase type
 * Each category contains essential questions and conditional follow-ups
 *
 * @constant {Object}
 */
export const QUESTION_TAXONOMY = {
  technical: {
    essential: [
      "What technology stack do you prefer for {component}?",
      "Any existing libraries or frameworks you want to use?",
      "Code organization preference (flat, modular, domain-driven)?",
      "Testing strategy (unit, integration, e2e)?",
      "Performance requirements (response time, load capacity)?",
      "Error handling approach (fail fast, graceful degradation)?",
      "Third-party services or APIs to integrate?"
    ],
    followUp: {
      // Conditional questions based on component type
      api: [
        "REST, GraphQL, or gRPC?",
        "Authentication method (JWT, sessions, OAuth)?",
        "Rate limiting requirements?",
        "API versioning strategy?"
      ],
      database: [
        "SQL or NoSQL preference?",
        "Migration strategy (up/down, forward-only)?",
        "Query performance optimization approach?",
        "Backup and recovery requirements?"
      ],
      infrastructure: [
        "Container orchestration (Docker, k8s, none)?",
        "CI/CD pipeline requirements?",
        "Monitoring and logging approach?",
        "Deployment environment (cloud, on-prem, hybrid)?"
      ]
    }
  },

  design: {
    essential: [
      "Do you have a design system or style guide to follow?",
      "Preferred UI framework/library (React, Vue, vanilla, etc.)?",
      "Responsive design requirements (mobile-first, desktop-first, specific breakpoints)?",
      "Accessibility requirements (WCAG level, screen reader support)?",
      "Component library to use (MUI, Ant Design, Tailwind, custom)?",
      "Design patterns preference (Material, iOS, custom)?",
      "Color palette or brand guidelines?",
      "Typography preferences (font families, scale)?",
      "Animation/interaction preferences (minimal, smooth transitions, rich interactions)?",
      "Layout system (grid, flexbox, CSS Grid, specific framework)?"
    ],
    followUp: {
      // Conditional questions based on UI complexity
      simpleUI: [
        "Form validation style (inline, on-submit)?",
        "Loading states needed (spinners, skeletons, progress bars)?"
      ],
      complexUI: [
        "State management approach (Context API, Redux, Zustand, MobX)?",
        "Any UI/UX constraints or design mockups to follow?",
        "User flow preferences (multi-step wizard, single page, modal-based)?",
        "Form design approach (inline validation, submit-only, progressive disclosure)?",
        "Error/success feedback patterns (toasts, inline messages, modal alerts)?",
        "Target user personas or use cases?",
        "Critical user journeys to support?",
        "Onboarding/empty state handling?",
        "Loading states and skeleton screens needed?",
        "Confirmation patterns for destructive actions?",
        "Help/documentation approach (tooltips, guided tours, help center)?",
        "Search/filter/sort requirements?",
        "Pagination or infinite scroll preference?"
      ]
    }
  },

  workflow: {
    essential: [
      "What's your risk tolerance? (move fast vs be cautious)",
      "Preferred commit granularity? (atomic vs feature branches)",
      "Are there any constraints I should know about?"
    ],
    followUp: {
      // Conditional questions based on workflow type
      automation: [
        "Trigger mechanism (cron, event-driven, manual)?",
        "Error notification approach (email, Slack, logs)?",
        "Retry/backoff strategy for failures?"
      ],
      orchestration: [
        "Parallel execution requirements?",
        "Dependency management approach?",
        "Progress tracking needed?"
      ]
    }
  }
};

/**
 * Detect phase type from phase goal description
 * Analyzes keywords to determine which question categories apply
 *
 * @param {string} phaseGoal - Phase objective/description from ROADMAP.md
 * @returns {Object} Boolean flags: { technical, design, workflow }
 *
 * @example
 * detectPhaseType('Build dashboard UI')
 * // Returns: { technical: true, design: true, workflow: true }
 *
 * detectPhaseType('API infrastructure setup')
 * // Returns: { technical: true, design: false, workflow: true }
 */
export function detectPhaseType(phaseGoal) {
  // Validate input
  if (!phaseGoal || typeof phaseGoal !== 'string') {
    // Default to basic technical + workflow for invalid input
    return { technical: true, design: false, workflow: true };
  }

  const goalLower = phaseGoal.toLowerCase();

  // Design keywords: UI, frontend, dashboard, component, design, interface, screen, page, view
  const designKeywords = [
    'ui', 'frontend', 'dashboard', 'component', 'design',
    'interface', 'screen', 'page', 'view', 'layout',
    'responsive', 'mobile', 'desktop', 'styling', 'theme'
  ];

  // Technical keywords: API, backend, infrastructure, database, server, service
  const technicalKeywords = [
    'api', 'backend', 'infrastructure', 'database', 'server',
    'service', 'endpoint', 'integration', 'library', 'framework',
    'architecture', 'storage', 'cache', 'queue', 'auth'
  ];

  // Workflow keywords: workflow, orchestration, automation, pipeline, ci/cd
  const workflowKeywords = [
    'workflow', 'orchestration', 'automation', 'pipeline',
    'ci/cd', 'deployment', 'tooling', 'process', 'build'
  ];

  // Detect presence of each category
  const hasDesign = designKeywords.some(keyword => goalLower.includes(keyword));
  const hasTechnical = technicalKeywords.some(keyword => goalLower.includes(keyword));
  const hasWorkflow = workflowKeywords.some(keyword => goalLower.includes(keyword));

  // Return detection results
  // Note: Most phases have technical aspects; design adds UI/UX questions
  return {
    technical: true, // Always include technical questions (stack, testing, architecture)
    design: hasDesign,
    workflow: true // Always include workflow questions (risk, commits, constraints)
  };
}

/**
 * Get appropriate questions for a phase based on its goal
 * Combines relevant question categories and returns structured question set
 *
 * @param {string} phaseGoal - Phase objective/description from ROADMAP.md
 * @returns {Array<Object>} Question objects with { category, questions }
 *
 * @example
 * getQuestionsForPhase('Dashboard UI implementation')
 * // Returns array with technical, design, and workflow question categories
 *
 * getQuestionsForPhase('API infrastructure')
 * // Returns array with technical and workflow question categories (no design)
 */
export function getQuestionsForPhase(phaseGoal) {
  // Detect which question categories apply
  const phaseType = detectPhaseType(phaseGoal);

  const questionSets = [];

  // Add technical questions if applicable
  if (phaseType.technical) {
    questionSets.push({
      category: 'Technical Approach',
      questions: QUESTION_TAXONOMY.technical.essential
    });
  }

  // Add design questions if applicable
  if (phaseType.design) {
    questionSets.push({
      category: 'Design & UX',
      questions: QUESTION_TAXONOMY.design.essential
    });
  }

  // Add workflow questions if applicable
  if (phaseType.workflow) {
    questionSets.push({
      category: 'Workflow Preferences',
      questions: QUESTION_TAXONOMY.workflow.essential
    });
  }

  // Return structured question sets
  return questionSets;
}

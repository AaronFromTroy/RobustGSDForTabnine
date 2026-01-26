# Plan-Phase Conversational Discovery - Test Scenarios

**Created:** 2026-01-26
**Purpose:** Validate phase planning uses conversational discovery (not rigid questionnaires)

## Issue Background

User wanted phase planning to work like new-project initialization:
- Start with ~3 essential questions
- Dig deeper only if user's answer is vague or raises new questions
- Conversational flow, not overwhelming lists
- User can provide more detail if they want

**Not** 8-25 questions asked all at once.

## Test Scenarios

### Scenario 1: Technical Phase - User Is Clear (Minimal Questions)

**Phase Goal:** Build RESTful API with authentication

```
Agent: "Before I create plans for Phase 2: Backend API, I have a few questions:

1. Any technology preferences for the backend?
2. Are there constraints I should know about?
3. How should we handle authentication?"

User: "Node.js with Express. No constraints. JWT for auth."

[USER CLEAR - no follow-ups needed]

Agent: "Perfect, that's clear. Based on our discussion:
- Backend: Node.js with Express
- Auth: JWT tokens
- No special constraints

I'll create plans for these components."

User: "Sounds good"

[Proceed to plan creation]
```

**Success Criteria:**
- ✓ Only asked 3 questions
- ✓ User gave clear answers
- ✓ Agent didn't ask unnecessary follow-ups
- ✓ Brief summary before planning

---

### Scenario 2: UI Phase - User Is Vague (Needs Depth)

**Phase Goal:** Create admin dashboard

```
Agent: "Before I create plans for Phase 3: Admin Dashboard, I have a few questions:

1. Do you have designs or mockups, or should I plan the UI structure?
2. Any specific UI framework or component library preferences?
3. Any accessibility or responsive design requirements?"

User: "No designs. React. Make it nice."

[VAGUE "make it nice" - dig deeper]

Agent: "Got it. By 'nice', are you thinking clean and minimal (like Stripe), data-dense (like AWS Console), or something else?"

User: "Clean and minimal, like Stripe"

Agent: "Perfect. For that aesthetic, Tailwind CSS works well. Should I use a component library like shadcn/ui, or custom components?"

User: "What's shadcn/ui?"

[USER UNFAMILIAR - explain option]

Agent: "shadcn/ui is a collection of pre-built React components styled with Tailwind. It's faster than building from scratch and gives a polished look. Alternative is building custom components, which takes longer but gives more control."

User: "Let's use shadcn/ui then"

Agent: "Smart choice. For the layout - sidebar navigation or top navigation?"

User: "Sidebar"

Agent: "Makes sense. One more thing - should it be responsive for mobile/tablet, or desktop-only?"

User: "Desktop-only is fine for v1"

[ENOUGH CONTEXT]

Agent: "Based on our discussion:
- UI: React with Tailwind CSS and shadcn/ui
- Style: Clean, minimal (Stripe aesthetic)
- Layout: Sidebar navigation
- Platform: Desktop-only (v1)

I'll create plans for this structure."
```

**Success Criteria:**
- ✓ Started with 3 questions
- ✓ Dug deeper on vague "make it nice" answer
- ✓ Explained unfamiliar option when user asked
- ✓ Asked follow-ups naturally based on answers
- ✓ Stopped when sufficient clarity achieved

---

### Scenario 3: Feature Phase - User Says "You Decide"

**Phase Goal:** Add payment processing

```
Agent: "Before I create plans for Phase 5: Payment Processing, I have a few questions:

1. Any payment provider preferences?
2. Are there constraints I should know about?
3. How should we handle payment flow?"

User: "I don't know much about payments. Just do what's best."

[USER UNCERTAIN - offer recommendation]

Agent: "No problem! For payment processing, I'd recommend Stripe because it's industry standard, handles security/compliance, and has excellent docs. Does Stripe work for you?"

User: "Sure, Stripe is fine"

Agent: "Great. For the payment flow, we have two options:

**Option A - Stripe Checkout (faster):**
Pre-built payment page, ships in days

**Option B - Stripe Elements (more control):**
Embedded form in your site, takes longer

Which appeals more?"

User: "Option A sounds better"

Agent: "Smart choice for v1. Last question - what should happen after successful payment? Email confirmation, redirect to success page, or both?"

User: "Both"

[CLEAR WITH RECOMMENDATIONS]

Agent: "Based on our discussion:
- Payment provider: Stripe
- Integration: Stripe Checkout (hosted)
- Post-payment: Email + success page redirect

I'll create plans for Stripe Checkout integration."
```

**Success Criteria:**
- ✓ Handled "you decide" gracefully
- ✓ Offered recommendation with reasoning
- ✓ Provided options with trade-offs
- ✓ Let user choose based on clear information
- ✓ 3 initial questions + context-based follow-ups

---

### Scenario 4: User Provides Detailed First Answer (Fewer Follow-Ups)

**Phase Goal:** Implement real-time notifications

```
Agent: "Before I create plans for Phase 4: Real-Time Notifications, I have a few questions:

1. How should users interact with notifications?
2. Any technical approach preferences?
3. What's most important - speed to ship or polish?"

User: "In-app notifications using Socket.io, similar to GitHub's notification bell. Store in PostgreSQL. Need it in 2 weeks so speed matters."

[VERY DETAILED - minimal follow-up]

Agent: "That's very clear! Just one clarification - should notifications persist with history, or just show live updates?"

User: "Persist with history, users should see past notifications"

Agent: "Perfect. One more thing - notification preferences? Should users be able to mute certain types?"

User: "Not for MVP"

[SUFFICIENT]

Agent: "Based on our discussion:
- Tech: Socket.io with PostgreSQL storage
- UX: GitHub-style notification bell
- Features: Persistent history, no preferences (v1)
- Timeline: 2 weeks (speed prioritized)

I'll create plans optimized for rapid delivery."
```

**Success Criteria:**
- ✓ User gave detailed initial answer
- ✓ Agent only asked 2 clarifying questions
- ✓ Didn't ask redundant questions about already-clear points
- ✓ Conversation was brief (user was clear upfront)

---

### Scenario 5: User Adds More Context Mid-Conversation

**Phase Goal:** Build search functionality

```
Agent: "Before I create plans for Phase 6: Search Feature, I have a few questions:

1. What should users be able to search?
2. Any technical approach preferences?
3. How sophisticated should search be - simple keyword match or advanced?"

User: "Search products. Not sure about tech. Just needs to work."

Agent: "Got it. For product search, should it support filters like price range, category, etc., or just text search?"

User: "Oh yeah, filters are important - price, category, brand"

[USER ADDS CONTEXT]

Agent: "Good to know. For the search tech, I'm thinking Elasticsearch for fast full-text search with filters. Alternative is database LIKE queries, which are simpler but slower. Given you want filters, Elasticsearch would be better. Does that work?"

User: "Actually, we're a small site with maybe 500 products. Is Elasticsearch overkill?"

[USER PROVIDES SCALE - changes recommendation]

Agent: "Ah, for 500 products, Elasticsearch is definitely overkill. PostgreSQL full-text search with GIN indexes would work great and be much simpler to manage. Sound better?"

User: "Yeah, that sounds better"

Agent: "Perfect. Last thing - search results: should they update as users type (instant search) or after they hit enter?"

User: "As they type would be nice"

[CLEAR WITH ADJUSTED APPROACH]

Agent: "Based on our discussion:
- Search: Products with text + filters (price, category, brand)
- Tech: PostgreSQL full-text search with GIN indexes
- UX: Instant search (updates as user types)
- Scale: Optimized for ~500 products

I'll create plans for PostgreSQL-based instant search with filters."
```

**Success Criteria:**
- ✓ User added context mid-conversation
- ✓ Agent adjusted recommendation based on new info (scale)
- ✓ Conversation adapted to user's evolving clarity
- ✓ Agent asked good follow-up when recommendation changed

---

### Scenario 6: User Wants to Discuss Trade-Offs

**Phase Goal:** Add caching layer

```
Agent: "Before I create plans for Phase 7: Caching Layer, I have a few questions:

1. What data should be cached?
2. Any technology preferences?
3. Are there performance requirements I should know about?"

User: "User profiles and frequently accessed data. What caching options do we have?"

[USER WANTS OPTIONS]

Agent: "For caching, main options are:

**Redis (separate service):**
- Very fast, powerful features
- Requires running Redis server
- Good for complex caching needs

**In-memory (application):**
- Simple, no extra infrastructure
- Limited by application memory
- Good for simpler caching

**Database query caching:**
- Built into PostgreSQL
- Least powerful but zero setup
- Good for basic performance improvement

What's most important for you - performance, simplicity, or cost?"

User: "We're on a tight budget and timeline. What's fastest to implement?"

Agent: "For speed of implementation with good results, in-memory caching using something like node-cache would be fastest - literally 30 minutes to add. Redis would take a day to set up properly. Given your constraints, I'd recommend starting with in-memory and migrating to Redis later if needed. Sound good?"

User: "Yeah, let's do in-memory first"

Agent: "Smart. For user profiles, should cache expire after a time (like 5 minutes) or stay cached until user data changes?"

User: "Expire after 5 minutes is fine"

[CLEAR WITH TRADE-OFF DISCUSSION]

Agent: "Based on our discussion:
- Cache: User profiles and frequent data
- Tech: In-memory with node-cache (for speed/budget)
- Strategy: Time-based expiration (5 minutes)
- Future: Can migrate to Redis if needed

I'll create plans for in-memory caching with node-cache."
```

**Success Criteria:**
- ✓ User asked for options (not just answer)
- ✓ Agent provided clear trade-offs
- ✓ Agent helped user decide based on constraints
- ✓ Conversation felt consultative, not interrogative

---

## Key Patterns Validated

| Pattern | Scenario | Result |
|---------|----------|--------|
| **Minimal questions for clear users** | Scenario 1 & 4 | ✓ 3 questions max when user is clear |
| **Dig deeper on vague answers** | Scenario 2 | ✓ "make it nice" → style clarification |
| **Handle "you decide" gracefully** | Scenario 3 | ✓ Offered recommendations with reasoning |
| **Adapt to new information** | Scenario 5 | ✓ Changed recommendation based on scale |
| **Support trade-off discussions** | Scenario 6 | ✓ Explained options when user asked |

## Conversational Quality Checklist

For each phase planning session, verify:

- [ ] Agent starts with ~3 questions (not 8-25)
- [ ] Questions are tailored to phase type (technical/UI/feature)
- [ ] Agent digs deeper only when answers are vague
- [ ] Agent offers recommendations when user uncertain
- [ ] Agent explains trade-offs when user asks for options
- [ ] Conversation feels natural (not checklist)
- [ ] Agent summarizes before creating plans
- [ ] Plans incorporate decisions from conversation
- [ ] CONTEXT.md captures key decisions

## Before vs After

**BEFORE (Rigid Questionnaire):**
```
Agent: "Before I create plans, I have questions:

1. Tech stack?
2. Library preferences?
3. Code organization?
4. Testing strategy?
5. Design system?
6. UI framework?
7. Responsive?
8. Accessibility?
9. Component library?
10. Animation style?
... (25 total questions)

Please answer what's relevant."
```

**AFTER (Conversational):**
```
Agent: "Before I create plans for Phase 3: Dashboard UI:

1. Do you have designs or should I plan the structure?
2. Any UI framework preferences?
3. Any accessibility requirements?"

User: "No designs. React. Basic accessibility."

[Agent only asks 3, gets clear answers, proceeds]
```

---

*Test scenarios for conversational phase planning added 2026-01-26*

# Decision Log Entry: Sub-Agent Workflow Structure

## Date: January 14, 2026

## Context
I was rebuilding my Week 2 microservice (Training Tracking) using the EPCC sub-agent pattern to learn orchestration and practice agent coordination. The goal was not just to build the app, but to understand how agents hand off work, share context, and prevent duplicate effort.

## Decision
I structured the workflow as **Sequential EPCC with documented handoffs**: 
- Researcher phase (Claude chat) → produces requirements
- Architect phase (Claude chat) → produces architecture spec
- Implementer phase (Claude Code) → builds the application
- Tester phase (Claude Code) → tests and validates
- Reviewer phase (Claude Code) → final review before "production"

Each phase has explicit handoff documents (`/handoffs/01-requirements.md`, etc.) and transcripts (`/transcripts/`) capturing decisions and reasoning.

## Options Considered

### 1. Strict EPCC (Completely Sequential)
Each phase is entirely separate. Researcher can't loop back. Architect only reads requirements. Implementer only reads architecture.

**Pros:**
- Clear boundaries and control points
- No ambiguity about who does what
- Easy to assign to different people
- Simple to audit (clear phase gates)

**Cons:**
- Requires perfect requirements upfront (unrealistic)
- If Architect finds gaps, can't easily loop back to Researcher
- Implementer can't start tests until everything is done
- Slower overall (fully sequential, zero parallelization)

### 2. Flexible EPCC (Allowed Iteration)
Phases are mostly sequential but allow looping back if needed. Tester can start writing tests while Implementer builds. Architect can ask Researcher clarifying questions mid-phase.

**Pros:**
- More realistic (you'll find gaps)
- Can parallelize some work (Tester + Implementer overlap)
- Faster overall
- Catches issues early when they're cheap to fix

**Cons:**
- Less clear boundaries (when does Researcher stop, really?)
- Harder to track (which version of requirements are we on?)
- Risk of infinite iteration loops
- Harder to audit which version of spec each agent was working from

### 3. Hybrid (Combined Phases)
Combine some responsibilities: Implementer + Tester in one role, Architect + Reviewer as one person, etc.

**Pros:**
- Fewer handoffs (less context loss)
- Faster (fewer phase transitions)
- Simpler setup (fewer agent prompts needed)
- Works well for solo work

**Cons:**
- Less specialization (implementer might miss test cases they should have thought about)
- Harder to catch mistakes (no fresh eyes in review)
- Harder to parallelize work
- Less suitable for team coordination or learning orchestration patterns

## Trade-offs Evaluated

### Strict vs Flexible Sequencing
**Strict is better if:** Requirements are truly locked, you have time for serial phases, you want clarity on responsibility boundaries.
**Flexible is better if:** Requirements will evolve, you want to parallelize work, you're learning (can loop back on mistakes).

**I chose Flexible** because:
- Requirements were somewhat clear (from Week 2 homework) but not complete
- I want to learn iteration patterns, not just linear assembly
- I have a tight deadline (tomorrow), so parallelizing Tester + Implementer saves time
- In real teams, nobody operates in strict silos

### Handoffs vs Context Sharing
**Handoff documents** (requirements → architecture → code) are explicit but can feel rigid.
**Shared context** (all agents read same central document) is flexible but risks duplication.

**I chose both:** Handoff documents for formal phase transitions + a shared Notion hub for current status. This is more overhead upfront but prevents the "I didn't know X was already decided" problem.

### Transcript Recording
**Light transcripts** (just save final outputs) are fast but lose reasoning.
**Heavy transcripts** (save all conversation) are thorough but verbose.

**I chose heavy** because:
- The homework asks for synthesis and reflection
- Understanding WHY decisions were made is as important as WHAT was decided
- Transcripts are reusable knowledge for future projects

## Outcome

**What worked:**
1. **Clear handoff documents** - Each agent knows exactly what to read and what to produce. No ambiguity.
2. **Explicit "done criteria"** - When each prompt says "you're done when X, Y, Z are documented," agents know when to stop.
3. **Parallel work** - Tester can start writing test cases while Implementer builds, saving time.
4. **Reusable prompts** - Built once, works for any CRUD microservice. Each future project is just "paste prompt + new context."

**What was harder:**
1. **Managing iteration loops** - If Implementer finds gaps in architecture, should they loop back to Architect or work around it?
2. **Transcript maintenance** - Staying disciplined about updating transcripts during the work, not after.
3. **Time boundaries** - Without strict time limits, Researcher could research forever. Needed to enforce "2 hours, then done."

**Would I do it again:**
Yes, but with adjustments (see Lessons Learned).

## Lessons Learned

1. **Handoff documents are the real value, not the prompts.** - The agent prompts (Researcher, Architect, etc.) are templates. The handoff documents (requirements, architecture spec, test results) are what makes the system work. They're the interface between agents.

2. **Clear "done criteria" prevents scope creep.** - If I'd said "Researcher is done when requirements feel complete," we'd still be researching. Saying "Researcher is done when these 6 questions are answered with trade-offs documented" forces a decision.

3. **Parallel work requires clear specifications.** - Tester can't start writing tests if the architecture spec is vague. EPCC forces you to write specs clearly so downstream agents can work independently.

4. **Iteration loops need explicit decision points.** - If Implementer finds a gap, should they loop back to Architect? Add it to "future work"? Decide upfront to prevent chaos.

5. **Reusable agents compound in value.** - The first time I write a Researcher prompt takes 2 hours. The second time I can reuse it in 5 minutes. By the 10th project, the upfront investment in good prompts pays for itself 100x over.

6. **Transcripts capture engineering thinking, not just code.** - The code is temporary. The reasoning in transcripts ("Why did we choose SQL Server?", "What trade-offs did we accept?") is reusable knowledge.

7. **EPCC forces conscious decision-making.** - Instead of "just building," you're forced to ask: Why this tech? What are we trading off? Who decides what? This clarity is the real skill being developed, not the app itself.
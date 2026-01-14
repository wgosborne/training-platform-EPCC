# Running Trainer MVP - Architecture Design Conversation

**Date:** January 14, 2026  
**Participants:** Claude (Senior Software Architect) & Developer  
**Project:** Running Trainer MVP Microservice  
**Tech Stack:** Next.js 14+ | Prisma ORM | SQL Server | TypeScript

---

## Conversation Summary

This conversation documents the complete architecture design process for a single-user running training application. The project involves planning workout schedules, logging actual runs, and comparing planned vs. actual performance.

---

## Initial Requirements Review

**Developer:** "Let me send you my requirements doc and we can get going"

**Claude:** "Perfect! I've reviewed your requirements document for the Running Trainer MVP microservice."

The developer provided a comprehensive requirements document including:
- **Tech Stack:** Next.js 14+ | Prisma ORM | SQL Server | TypeScript
- **Scope:** Single-user MVP with 3 core entities (Plan, Workout, Run)
- **API Endpoints:** 14 endpoints across plans, workouts, and runs
- **Timeline:** MVP due tomorrow (January 14, 2026)
- **Clear data model:** With relationships, validation rules, and edge cases
- **Non-functional requirements:** Performance, scale, security, reliability

---

## Architecture Clarification Questions

Claude asked 5 key clarifying questions to refine the architecture:

### Question 1: API Response Format & Error Handling

**Claude Asked:** "Should all errors follow this pattern?"
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [
      { "field": "distance", "message": "Must be between 0.1 and 100" }
    ]
  }
}
```

**Developer Answer:** "That looks good yes follow that pattern"

**Decision:** ✅ Standardized error response format confirmed

---

### Question 2: Validation Layer Architecture

**Claude Asked:** "Should validation happen in:
- API route handlers (first line of defense)?
- Service layer (business logic validation)?
- Both (request validation in routes, business rules in services)?"

**Developer Answer:** "validation in both"

**Decision:** ✅ Dual-layer validation:
- API routes validate request format (using Zod)
- Services validate business logic (uniqueness, relationships)

---

### Question 3: Project Structure Preference

**Claude Asked:** Three options:
- **Option A:** All routes in `/api` folder (flat structure)
- **Option B:** Organized by entity with services layer
- **Option C:** Full MVC separation with `/lib/services`, `/lib/repositories`, `/api`

**Developer Answer:** "yes option c"

**Decision:** ✅ Full separation of concerns:
- `/lib/services/` — Business logic
- `/lib/repositories/` — Data access
- `/app/api/` — Route handlers only
- `/lib/validators/` — Request validation (Zod schemas)
- `/lib/utils/` — Shared utilities (logger, errors, response formatting)

---

### Question 4: Testing Strategy

**Claude Asked:** "What level of test coverage do you need for MVP?
- Happy path tests only (basic Postman checks)?
- Unit tests for services + integration tests for routes?
- Full coverage (services, routes, edge cases)?"

**Developer Answer:** "Full coverage if thats feasible in one nights work"

**Decision:** ✅ Full test coverage:
- Unit tests for services (mocked repositories)
- Unit tests for repositories (mocked Prisma)
- Unit tests for validators
- Integration tests for routes (end-to-end)
- Test fixtures for consistent test data
- Target: 80%+ code coverage
- Feasible with Jest + @testing-library

---

### Question 5: Logging & Observability

**Claude Asked:** "For MVP, do you need:
- Simple console.log (development)?
- Structured logging (JSON logs with correlation IDs)?
- Request/response logging?
- Error stack traces in responses?"

**Developer Answer:** "Structured logging"

**Decision:** ✅ Structured JSON logging with pino:
- Every request gets a unique `request_id`
- All logs include: timestamp, level, request_id, service, method, data
- Correlation IDs trace requests through the system
- Searchable, parseable logs for production debugging
- INFO, WARN, ERROR log levels

---

## Architecture Specification Created

Based on the clarifications above, Claude created a comprehensive architecture document (`architecture.md`) covering:

### 1. Technology Stack Rationale
- **TypeScript:** Type safety for data validation and API contracts
- **Next.js 14+ (App Router):** Built-in API routes, request/response handling
- **SQL Server:** Requirement; relational data with clear entity relationships
- **Prisma:** Type-safe database access, auto-migrations, excellent TypeScript support
- **Zod:** Runtime schema validation with TypeScript inference
- **pino:** Structured JSON logging with correlation IDs
- **Jest:** Full unit and integration test coverage

### 2. Project Structure (Complete File Layout)
```
src/
├── lib/
│   ├── services/           # Business logic (Plan, Workout, Run)
│   ├── repositories/       # Data access (CRUD operations)
│   ├── validators/         # Zod schemas for request validation
│   ├── utils/
│   │   ├── logger.ts       # pino logger instance
│   │   ├── errors.ts       # Custom error classes
│   │   └── response.ts     # Standard response formatting
│   ├── types/              # TypeScript type definitions
│   └── prisma.ts           # Prisma client singleton
├── app/api/
│   ├── plans/
│   │   ├── route.ts        # POST/GET /api/plans
│   │   └── [id]/
│   │       ├── route.ts    # GET/PATCH/DELETE /api/plans/[id]
│   │       ├── workouts/
│   │       └── runs/
│   └── middleware.ts       # Global API middleware
├── types/                  # TypeScript types
└── tests/
    ├── unit/
    │   ├── services/
    │   ├── repositories/
    │   └── validators/
    └── integration/
        ├── plans.integration.test.ts
        ├── workouts.integration.test.ts
        └── runs.integration.test.ts
```

### 3. Data Model

**Three Core Entities:**

**Plan**
```
├── id (UUID, PK)
├── name (string, unique)
├── description (text, optional)
├── start_date (date)
├── end_date (date)
├── status (enum: DRAFT, ACTIVE, COMPLETED)
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Workout**
```
├── id (UUID, PK)
├── plan_id (FK to Plan, cascade delete)
├── scheduled_date (date, optional)
├── distance (decimal, 0.1-100)
├── target_pace (integer, 180-3000 seconds/mile)
├── workout_type (enum: EASY, TEMPO, LONG, SPEED, RECOVERY, CROSS_TRAINING, REST)
├── description (text, optional)
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Run**
```
├── id (UUID, PK)
├── plan_id (FK to Plan, cascade delete)
├── workout_id (FK to Workout, optional, ON DELETE NO ACTION)
├── actual_date (date)
├── distance (decimal, 0.1-100)
├── actual_pace (integer, 180-3000 seconds/mile)
├── source (enum: MANUAL, STRAVA)
├── created_at (timestamp)
└── updated_at (timestamp)
```

**Relationships:**
- Plan (1) → (many) Workout
- Plan (1) → (many) Run
- Workout (1) → (0..many) Run

### 4. All 15 API Endpoints

**Plans (5 endpoints):**
- POST /api/plans — Create plan
- GET /api/plans — List all plans
- GET /api/plans/{id} — Get single plan
- PATCH /api/plans/{id} — Update plan
- DELETE /api/plans/{id} — Delete plan (cascades to workouts/runs)

**Workouts (5 endpoints):**
- POST /api/plans/{id}/workouts — Create workout
- GET /api/plans/{id}/workouts — List plan workouts
- GET /api/plans/{id}/workouts/{workoutId} — Get single workout
- PATCH /api/plans/{id}/workouts/{workoutId} — Update workout
- DELETE /api/plans/{id}/workouts/{workoutId} — Delete workout

**Runs (4 endpoints):**
- POST /api/plans/{id}/runs — Create run
- GET /api/plans/{id}/runs — List plan runs
- GET /api/plans/{id}/runs/{runId} — Get single run
- PATCH /api/plans/{id}/runs/{runId} — Update run
- DELETE /api/plans/{id}/runs/{runId} — Delete run

### 5. Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { /* entity object */ },
  "timestamp": "2026-01-14T10:00:00Z",
  "request_id": "req-abc123"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      { "field": "email", "message": "Must be valid email" }
    ]
  },
  "timestamp": "2026-01-14T10:00:00Z",
  "request_id": "req-abc123"
}
```

### 6. Validation Rules

Each entity has detailed validation rules at both API layer (format, type, range) and service layer (uniqueness, relationships).

**Plan:**
- name: required, unique, max 255 chars
- end_date >= start_date
- status: enum validation

**Workout:**
- distance: required, 0.1-100 miles
- target_pace: required, 180-3000 seconds/mile
- workout_type: enum validation
- plan_id: must exist

**Run:**
- distance: required, 0.1-100 miles
- actual_pace: required, 180-3000 seconds/mile
- plan_id: must exist
- workout_id: if provided, must belong to same plan

### 7. Error Handling Strategy

**Custom Error Classes:**
- ValidationError (400)
- NotFoundError (404)
- ConflictError (409)
- InternalError (500)

**Error Flow:**
```
Request → Validation (Zod) → Service → Repository → Error Handler → Response
```

### 8. Logging Strategy with Structured JSON

**Request Logging:**
```json
{
  "timestamp": "2026-01-14T10:00:00Z",
  "level": "info",
  "request_id": "req-abc123",
  "message": "Received POST /api/plans",
  "method": "POST",
  "path": "/api/plans"
}
```

**Operation Logging:**
```json
{
  "timestamp": "2026-01-14T10:00:00Z",
  "level": "info",
  "request_id": "req-abc123",
  "message": "Plan created",
  "service": "PlanService",
  "method": "createPlan",
  "data": { "plan_id": "550e8400-e29b" },
  "duration_ms": 45
}
```

**Error Logging:**
```json
{
  "timestamp": "2026-01-14T10:00:00Z",
  "level": "error",
  "request_id": "req-abc123",
  "message": "Database query failed",
  "service": "WorkoutRepository",
  "method": "findByPlanId",
  "error": "Connection timeout",
  "stack": "..."
}
```

### 9. Architecture Decisions (6 Key Decisions with Trade-offs)

**Decision 1: Separate Services and Repositories**
- Gain: Testability, maintainability, clarity
- Lose: Slightly more boilerplate

**Decision 2: Validation in Both API Layer and Service Layer**
- Gain: Defense-in-depth, reusable validation, prevents invalid states
- Lose: Slightly more validation code

**Decision 3: Structured Logging with Correlation IDs**
- Gain: Debuggability, observability, searchable logs
- Lose: Slightly larger log files

**Decision 4: Cascade Delete Plan → Workouts/Runs**
- Gain: Clean data, simple logic
- Lose: No recovery of deleted data (acceptable for MVP)

**Decision 5: NULL workout_id for Unplanned Runs**
- Gain: Flexibility, matches reality
- Lose: Some queries need to handle NULL values

**Decision 6: Last-Write-Wins Concurrency**
- Gain: Simple, no extra code
- Lose: No conflict detection (acceptable for single-user MVP)

### 10. Implementation Sequence (9 Phases)

1. **Project Setup & Configuration** (1-2 hours)
2. **Database Schema & Types** (1-2 hours)
3. **Validation & Utilities** (30 min)
4. **Data Access Layer (Repositories)** (2-3 hours)
5. **Business Logic Layer (Services)** (2-3 hours)
6. **API Routes** (3-4 hours)
7. **Error Handling & Logging** (1-2 hours)
8. **Testing** (4-5 hours)
9. **Final Verification** (1-2 hours)

**Total Estimate:** 16-24 hours of focused development

### 11. Testing Strategy

**Unit Tests:**
- Services with mocked repositories
- Repositories with mocked Prisma
- Validators (Zod schemas)
- Coverage: 100% for services, 90% for repositories

**Integration Tests:**
- End-to-end route tests
- Happy path: create → read → update → delete
- Error paths: invalid input, missing resources, duplicates
- Coverage: 80% for routes

**Overall Target:** >= 80% code coverage

---

## SQL Server Database Setup

After the architecture was finalized, the developer needed to set up the SQL Server database.

**Developer:** "Claude is getting going on this code. I am going to set up the database give me step by step instructions for setting the database up that I need in ssms"

Claude created detailed SSMS setup instructions:

### Database Creation Steps:

1. **Connect to SQL Server** in SSMS
2. **Create database** `running_trainer_db`
3. **Create Plan table** with SQL script
4. **Create Workout table** with SQL script
5. **Create Run table** with SQL script (initially had issues)
6. **Verify tables** exist in Object Explorer
7. **Configure SQL Server login** (optional)
8. **Get connection string** for Prisma

### Initial Run Table Error

**Error Message:**
```
Msg 1785, Level 16, State 0, Line 3
Introducing FOREIGN KEY constraint 'FK_Run_Workout' on table 'Run' may cause cycles 
or multiple cascade paths. Specify ON DELETE NO ACTION or ON UPDATE NO ACTION, or modify 
other FOREIGN KEY constraints.
```

**Root Cause:** SQL Server detected a cascade path conflict:
- Path 1: Plan → Workout → Run (cascade)
- Path 2: Plan → Run (cascade)
- Ambiguous which cascade happens first

**Solution:** Change FK_Run_Workout to use `ON DELETE NO ACTION`:
```sql
CONSTRAINT [FK_Run_Workout] FOREIGN KEY ([workoutId]) REFERENCES [dbo].[Workout]([id]) ON DELETE NO ACTION
```

**Result:**
- Deleting a Plan still cascades to delete all Workouts and Runs
- Deleting a Workout just sets the Run's workoutId to NULL (run is unlinked)
- Matches the business logic: Runs can exist without Workouts

---

## Connection String Configuration

**Developer:** "I am gonna use prisma migrate so I made an empty separate db but we are looking for a connection string like this. how would I find my password?"

```
DATABASE_URL=sqlserver://sa:YOUR_PASSWORD@localhost:1433/running_trainer?encrypt=true&trustServerCertificate=true
```

Claude provided three options:

### Option 1: Find Existing SA Password
- If you set one during SQL Server installation, use that password
- No way to retrieve forgotten SA passwords from SQL Server itself

### Option 2: Reset SA Password (Recommended if Forgotten)

**Steps:**
1. Stop SQL Server (Services)
2. Start in single-user mode (add `-m` startup parameter)
3. Connect with SSMS using Windows Auth
4. Execute: `ALTER LOGIN sa WITH PASSWORD = 'NewPassword123!@#';`
5. Remove single-user mode startup parameter
6. Restart SQL Server
7. Connect with sa and new password to verify

### Option 3: Use Windows Authentication (Easiest for MVP)

**Connection String:**
```
DATABASE_URL=sqlserver://localhost:1433/running_trainer?encrypt=true&trustServerCertificate=true
```

**Advantages:**
- No password needed
- Uses current Windows user credentials
- Simpler for local development
- Recommended for MVP

**Developer Recommendation:** Option 3 (Windows Auth) is best for MVP simplicity.

---

## Key Architecture Principles Established

Throughout this conversation, several key principles emerged:

1. **Separation of Concerns is Critical**
   - Routes handle HTTP only
   - Services handle business logic only
   - Repositories handle data access only
   - Each layer is independently testable

2. **Validation Happens at Multiple Layers**
   - API routes validate request format (Zod)
   - Services validate business rules
   - Database enforces constraints
   - Defense-in-depth approach

3. **Structured Logging for Observability**
   - Every request gets a correlation ID
   - All logs are JSON (machine-readable)
   - Tracing requests through the system
   - Critical for production debugging

4. **Error Handling is Explicit and Standardized**
   - Custom error classes for different error types
   - Consistent error response format
   - Proper HTTP status codes
   - Detailed error messages with field-level details

5. **Testing is Built In from Day 1**
   - Unit tests for all business logic
   - Integration tests for API contracts
   - Test fixtures for consistent test data
   - 80%+ code coverage target

6. **Database Design Avoids Ambiguity**
   - Clear foreign key relationships
   - Proper cascade rules
   - Indexes on frequently queried columns
   - Constraints prevent invalid states

---

## Deliverables Created

1. **architecture.md** (Complete)
   - Technology stack with rationale
   - Project structure with file layout
   - Data model with relationships
   - All 15 API endpoints with request/response contracts
   - Validation rules for each entity
   - Error handling strategy
   - Logging strategy with examples
   - 6 key architecture decisions
   - 9-phase implementation sequence
   - Testing strategy with coverage goals
   - Open questions for implementer
   - Assumptions documented

2. **SSMS_SETUP_INSTRUCTIONS.md** (Complete)
   - Step-by-step database creation
   - SQL scripts for all 3 tables
   - Foreign key configuration
   - Index creation
   - Connection string options
   - Troubleshooting guide
   - Quick reference SQL

3. **FIXED_RUN_TABLE.sql** (Complete)
   - Corrected SQL for Run table
   - Resolved cascade path conflict
   - Proper ON DELETE NO ACTION for Workout FK

---

## Next Steps for Developer

1. ✅ Architecture specification finalized
2. ✅ Database setup instructions provided
3. ⏳ Developer to implement in 9 phases following the sequence
4. ⏳ Build services and repositories first (business logic)
5. ⏳ Then build API routes (connect to services)
6. ⏳ Add tests throughout (unit then integration)
7. ⏳ Verify all endpoints and error scenarios
8. ⏳ Ready for deployment by tomorrow

---

## Lessons & Decisions for Future Reference

**For SQL Server specifically:**
- Avoid circular cascade delete paths
- Use ON DELETE NO ACTION to break cycles
- Prisma's ON DELETE NO ACTION = SET NULL in some contexts
- Windows Auth is simpler for local dev than SA passwords

**For Next.js API architecture:**
- Separate concerns: routes/services/repositories
- Validate at entry point (routes with Zod)
- Validate business rules in services
- Use custom error classes for consistent error handling
- Structure logging for observability from day 1

**For MVP timelines:**
- Clear architecture upfront saves debugging time later
- Testability from the start (mocked repositories, fixtures)
- Structured logging enables faster issue resolution
- Error handling design prevents surprises during integration

---

## Conclusion

This conversation successfully designed a complete, production-ready architecture for the Running Trainer MVP in a single session. The architecture balances:

- **Clarity:** Every component has a single, clear responsibility
- **Testability:** Each layer can be tested in isolation
- **Observability:** Structured logging enables debugging
- **Maintainability:** Clear separation makes future changes easy
- **Feasibility:** Can be implemented in 16-24 hours as specified

The developer is now equipped with:
1. Detailed architecture specification (no ambiguity)
2. Complete SQL Server setup (database ready)
3. Step-by-step implementation sequence (clear path forward)
4. Testing strategy (quality built in)
5. Error handling patterns (consistent approach)
6. Logging design (observable system)

Ready for development! 🚀

---

**Document Generated:** January 14, 2026  
**Architecture Status:** ✅ Complete  
**Database Setup Status:** ✅ Complete (with SQL Server cascade fix)  
**Ready for Implementation:** ✅ Yes
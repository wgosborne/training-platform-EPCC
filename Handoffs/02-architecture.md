# Architecture: Running Trainer MVP Microservice

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Language | TypeScript | Type safety for data validation and API contracts; required by Next.js best practices |
| Framework | Next.js 14+ (App Router) | Built-in API routes, request/response handling, and deployment simplicity for MVP |
| Database | SQL Server | Requirement; relational data with clear entity relationships (Plan → Workout → Run) |
| ORM | Prisma | Type-safe database access, auto-migrations, excellent TypeScript support |
| Testing | Jest + @testing-library | Full unit and integration test coverage; Jest for service/repository logic, React Testing Library for routes |
| Validation | Zod | Runtime schema validation with TypeScript inference; pairs perfectly with Prisma types |
| Logging | pino | Structured JSON logging with correlation IDs; minimal overhead for performance |

### Rationale for Stack

This stack is optimized for **speed of development** and **clarity of architecture**. TypeScript catches errors at compile-time. Prisma eliminates raw SQL and guarantees type safety between database and application. Next.js App Router provides clean, file-based API routes with built-in request/response handling. Zod validates at the API boundary, ensuring bad data never reaches business logic. Structured logging (pino) gives visibility into production issues without cluttering code. For an MVP due tomorrow, this reduces debugging time and keeps the codebase maintainable.

---

## Project Structure

```
running-trainer/
├── src/
│   ├── lib/
│   │   ├── services/                    # Business logic layer
│   │   │   ├── plan.service.ts
│   │   │   ├── workout.service.ts
│   │   │   ├── run.service.ts
│   │   │   └── index.ts
│   │   ├── repositories/                # Data access layer
│   │   │   ├── plan.repository.ts
│   │   │   ├── workout.repository.ts
│   │   │   ├── run.repository.ts
│   │   │   └── index.ts
│   │   ├── validators/                  # Zod schemas for validation
│   │   │   ├── plan.validator.ts
│   │   │   ├── workout.validator.ts
│   │   │   ├── run.validator.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── logger.ts                # pino logger instance and helpers
│   │   │   ├── errors.ts                # Custom error classes
│   │   │   └── response.ts              # Standard response formatting
│   │   └── prisma.ts                    # Prisma client singleton
│   ├── app/
│   │   └── api/
│   │       ├── plans/
│   │       │   ├── route.ts             # POST /api/plans, GET /api/plans
│   │       │   └── [id]/
│   │       │       ├── route.ts         # GET/PATCH/DELETE /api/plans/[id]
│   │       │       ├── workouts/
│   │       │       │   ├── route.ts     # POST/GET /api/plans/[id]/workouts
│   │       │       │   └── [workoutId]/
│   │       │       │       └── route.ts # GET/PATCH/DELETE /api/plans/[id]/workouts/[workoutId]
│   │       │       └── runs/
│   │       │           ├── route.ts     # POST/GET /api/plans/[id]/runs
│   │       │           └── [runId]/
│   │       │               └── route.ts # GET/PATCH/DELETE /api/plans/[id]/runs/[runId]
│   │       └── middleware.ts            # Global API middleware (logging, error handling)
│   └── types/
│       ├── index.ts
│       ├── plan.types.ts                # Plan type definitions
│       ├── workout.types.ts
│       └── run.types.ts
├── prisma/
│   ├── schema.prisma                    # Database schema
│   └── migrations/                      # Auto-generated migrations
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── plan.service.test.ts
│   │   │   ├── workout.service.test.ts
│   │   │   └── run.service.test.ts
│   │   ├── repositories/
│   │   │   ├── plan.repository.test.ts
│   │   │   ├── workout.repository.test.ts
│   │   │   └── run.repository.test.ts
│   │   └── validators/
│   │       ├── plan.validator.test.ts
│   │       ├── workout.validator.test.ts
│   │       └── run.validator.test.ts
│   ├── integration/
│   │   ├── plans.integration.test.ts
│   │   ├── workouts.integration.test.ts
│   │   └── runs.integration.test.ts
│   └── fixtures/
│       ├── plan.fixtures.ts
│       ├── workout.fixtures.ts
│       └── run.fixtures.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
└── .env.local (local development only)
```

### Component Responsibilities

**Services (`/lib/services/`):**
- Implement business logic (validation, calculations, orchestration)
- Call repositories for data access
- Return domain objects or throw typed errors
- Never handle HTTP (no req/res)
- Unit testable in isolation

**Repositories (`/lib/repositories/`):**
- CRUD operations only (create, read, update, delete)
- Direct Prisma client calls
- No business logic
- Return domain objects or null
- Unit testable with mocked Prisma

**Validators (`/lib/validators/`):**
- Zod schemas for request body validation
- Export both validator functions and types
- Used in API routes to parse/validate input
- Reusable across multiple routes if needed

**API Routes (`/app/api/`):**
- Parse request body/params using validators
- Call service methods
- Catch errors and format responses
- Return JSON with correct status code
- Never contain business logic

**Utils (`/lib/utils/`):**
- **logger.ts:** Structured logging with request correlation IDs
- **errors.ts:** Custom error classes (ValidationError, NotFoundError, etc.)
- **response.ts:** Standard response formatting (success/error objects)

**Types (`/src/types/`):**
- TypeScript interfaces mirroring database models
- Zod schema types (inferred from validators)
- Reusable across services, repositories, routes

---

## Data Model

### Entity-Relationship Diagram

```
Plan (1) ──────────────── (many) Workout
  ├── id (PK)                      ├── id (PK)
  ├── name (unique)                ├── plan_id (FK)
  ├── description                  ├── scheduled_date (nullable)
  ├── start_date                   ├── distance
  ├── end_date                     ├── target_pace
  ├── status                       ├── workout_type
  ├── created_at                   ├── description
  └── updated_at                   ├── created_at
                                   └── updated_at

Plan (1) ──────────────── (many) Run
  └── (same as above)              ├── id (PK)
                                   ├── plan_id (FK)
                                   ├── workout_id (FK, nullable)
                                   ├── actual_date
                                   ├── distance
                                   ├── actual_pace
                                   ├── source
                                   ├── created_at
                                   └── updated_at

Workout (1) ──────────────── (0..many) Run
  └── (many can be NULL)           └── (via workout_id FK)
```

### Database Indexes

| Table | Column(s) | Type | Reason |
|-------|-----------|------|--------|
| Plan | id | Primary Key | Fast lookups by ID |
| Plan | name | Unique | Prevent duplicate plan names |
| Workout | plan_id | Foreign Key | Speed filtering workouts by plan |
| Workout | scheduled_date | Regular | Speed calendar queries (workouts on specific dates) |
| Run | plan_id | Foreign Key | Speed filtering runs by plan |
| Run | actual_date | Regular | Speed calendar queries (runs on specific dates) |
| Run | workout_id | Foreign Key | Speed reverse lookups (runs for a workout) |

### Prisma Schema Outline

```prisma
model Plan {
  id        String   @id @default(cuid())
  name      String   @unique
  description String?
  startDate DateTime @db.Date
  endDate   DateTime @db.Date
  status    Status   @default(DRAFT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  workouts Workout[]
  runs     Run[]

  @@index([name])
}

model Workout {
  id            String   @id @default(cuid())
  planId        String
  plan          Plan     @relation(fields: [planId], references: [id], onDelete: Cascade)
  scheduledDate DateTime? @db.Date
  distance      Decimal  @db.Decimal(5, 2)
  targetPace    Int
  workoutType   WorkoutType
  description   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  runs Run[]

  @@index([planId])
  @@index([scheduledDate])
}

model Run {
  id         String   @id @default(cuid())
  planId     String
  plan       Plan     @relation(fields: [planId], references: [id], onDelete: Cascade)
  workoutId  String?
  workout    Workout? @relation(fields: [workoutId], references: [id], onDelete: SetNull)
  actualDate DateTime @db.Date
  distance   Decimal  @db.Decimal(5, 2)
  actualPace Int
  source     Source   @default(MANUAL)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([planId])
  @@index([actualDate])
  @@index([workoutId])
}

enum Status {
  DRAFT
  ACTIVE
  COMPLETED
}

enum WorkoutType {
  EASY
  TEMPO
  LONG
  SPEED
  RECOVERY
  CROSS_TRAINING
  REST
}

enum Source {
  MANUAL
  STRAVA
}
```

---

## API Design

### Endpoints

| Method | Path | Description | Status |
|--------|------|-------------|--------|
| POST | /api/plans | Create plan | 201 |
| GET | /api/plans | List all plans | 200 |
| GET | /api/plans/:id | Get single plan | 200 |
| PATCH | /api/plans/:id | Update plan | 200 |
| DELETE | /api/plans/:id | Delete plan | 204 |
| POST | /api/plans/:id/workouts | Create workout | 201 |
| GET | /api/plans/:id/workouts | List plan workouts | 200 |
| GET | /api/plans/:id/workouts/:workoutId | Get single workout | 200 |
| PATCH | /api/plans/:id/workouts/:workoutId | Update workout | 200 |
| DELETE | /api/plans/:id/workouts/:workoutId | Delete workout | 204 |
| POST | /api/plans/:id/runs | Create run | 201 |
| GET | /api/plans/:id/runs | List plan runs | 200 |
| GET | /api/plans/:id/runs/:runId | Get single run | 200 |
| PATCH | /api/plans/:id/runs/:runId | Update run | 200 |
| DELETE | /api/plans/:id/runs/:runId | Delete run | 204 |

### Request/Response Contracts

#### POST /api/plans (Create Plan)

**Request:**
```json
{
  "name": "St. Jude Half Marathon 2025",
  "description": "12-week training plan",
  "start_date": "2025-02-01",
  "end_date": "2025-04-27",
  "status": "DRAFT"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b",
    "name": "St. Jude Half Marathon 2025",
    "description": "12-week training plan",
    "start_date": "2025-02-01",
    "end_date": "2025-04-27",
    "status": "DRAFT",
    "created_at": "2026-01-14T10:00:00Z",
    "updated_at": "2026-01-14T10:00:00Z"
  },
  "timestamp": "2026-01-14T10:00:00Z",
  "request_id": "req-abc123"
}
```

**Error (400 Bad Request - validation):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      { "field": "end_date", "message": "end_date must be >= start_date" },
      { "field": "name", "message": "name is required" }
    ]
  },
  "timestamp": "2026-01-14T10:00:00Z",
  "request_id": "req-abc123"
}
```

**Error (400 Bad Request - business rule):**
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Plan name already exists",
    "details": null
  },
  "timestamp": "2026-01-14T10:00:00Z",
  "request_id": "req-abc123"
}
```

#### GET /api/plans (List Plans)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b",
      "name": "St. Jude Half Marathon 2025",
      "description": "12-week training plan",
      "start_date": "2025-02-01",
      "end_date": "2025-04-27",
      "status": "ACTIVE",
      "created_at": "2026-01-14T10:00:00Z",
      "updated_at": "2026-01-14T10:00:00Z"
    }
  ],
  "timestamp": "2026-01-14T10:00:00Z",
  "request_id": "req-abc123"
}
```

#### GET /api/plans/:id (Get Single Plan)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b",
    "name": "St. Jude Half Marathon 2025",
    "description": "12-week training plan",
    "start_date": "2025-02-01",
    "end_date": "2025-04-27",
    "status": "ACTIVE",
    "created_at": "2026-01-14T10:00:00Z",
    "updated_at": "2026-01-14T10:00:00Z"
  },
  "timestamp": "2026-01-14T10:00:00Z",
  "request_id": "req-abc123"
}
```

**Error (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Plan with id 550e8400-e29b not found",
    "details": null
  },
  "timestamp": "2026-01-14T10:00:00Z",
  "request_id": "req-abc123"
}
```

#### PATCH /api/plans/:id (Update Plan)

**Request (all fields optional):**
```json
{
  "name": "Updated Plan Name",
  "status": "ACTIVE"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b",
    "name": "Updated Plan Name",
    "description": "12-week training plan",
    "start_date": "2025-02-01",
    "end_date": "2025-04-27",
    "status": "ACTIVE",
    "created_at": "2026-01-14T10:00:00Z",
    "updated_at": "2026-01-14T10:01:00Z"
  },
  "timestamp": "2026-01-14T10:01:00Z",
  "request_id": "req-abc123"
}
```

#### DELETE /api/plans/:id (Delete Plan)

**Response (204 No Content)**
(Empty body, cascades delete to all workouts and runs)

#### POST /api/plans/:id/workouts (Create Workout)

**Request:**
```json
{
  "scheduled_date": "2025-02-03",
  "distance": 5.2,
  "target_pace": 360,
  "workout_type": "EASY",
  "description": "Easy 5-miler"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b",
    "plan_id": "550e8400-e29b",
    "scheduled_date": "2025-02-03",
    "distance": "5.20",
    "target_pace": 360,
    "workout_type": "EASY",
    "description": "Easy 5-miler",
    "created_at": "2026-01-14T10:05:00Z",
    "updated_at": "2026-01-14T10:05:00Z"
  },
  "timestamp": "2026-01-14T10:05:00Z",
  "request_id": "req-abc123"
}
```

**Error (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Plan with id 550e8400-e29b not found",
    "details": null
  },
  "timestamp": "2026-01-14T10:05:00Z",
  "request_id": "req-abc123"
}
```

#### GET /api/plans/:id/workouts (List Workouts)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b",
      "plan_id": "550e8400-e29b",
      "scheduled_date": "2025-02-03",
      "distance": "5.20",
      "target_pace": 360,
      "workout_type": "EASY",
      "description": "Easy 5-miler",
      "created_at": "2026-01-14T10:05:00Z",
      "updated_at": "2026-01-14T10:05:00Z"
    }
  ],
  "timestamp": "2026-01-14T10:05:00Z",
  "request_id": "req-abc123"
}
```

#### GET /api/plans/:id/workouts/:workoutId (Get Single Workout)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b",
    "plan_id": "550e8400-e29b",
    "scheduled_date": "2025-02-03",
    "distance": "5.20",
    "target_pace": 360,
    "workout_type": "EASY",
    "description": "Easy 5-miler",
    "created_at": "2026-01-14T10:05:00Z",
    "updated_at": "2026-01-14T10:05:00Z"
  },
  "timestamp": "2026-01-14T10:05:00Z",
  "request_id": "req-abc123"
}
```

#### PATCH /api/plans/:id/workouts/:workoutId (Update Workout)

**Request (all fields optional):**
```json
{
  "distance": 5.5,
  "target_pace": 365
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b",
    "plan_id": "550e8400-e29b",
    "scheduled_date": "2025-02-03",
    "distance": "5.50",
    "target_pace": 365,
    "workout_type": "EASY",
    "description": "Easy 5-miler",
    "created_at": "2026-01-14T10:05:00Z",
    "updated_at": "2026-01-14T10:06:00Z"
  },
  "timestamp": "2026-01-14T10:06:00Z",
  "request_id": "req-abc123"
}
```

#### DELETE /api/plans/:id/workouts/:workoutId (Delete Workout)

**Response (204 No Content)**
(Runs linked to this workout keep the reference but workout is deleted)

#### POST /api/plans/:id/runs (Create Run)

**Request:**
```json
{
  "workout_id": "660e8400-e29b",
  "actual_date": "2025-02-03",
  "distance": 5.2,
  "actual_pace": 361,
  "source": "MANUAL"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b",
    "plan_id": "550e8400-e29b",
    "workout_id": "660e8400-e29b",
    "actual_date": "2025-02-03",
    "distance": "5.20",
    "actual_pace": 361,
    "source": "MANUAL",
    "created_at": "2026-01-14T10:10:00Z",
    "updated_at": "2026-01-14T10:10:00Z"
  },
  "timestamp": "2026-01-14T10:10:00Z",
  "request_id": "req-abc123"
}
```

#### GET /api/plans/:id/runs (List Runs)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b",
      "plan_id": "550e8400-e29b",
      "workout_id": "660e8400-e29b",
      "actual_date": "2025-02-03",
      "distance": "5.20",
      "actual_pace": 361,
      "source": "MANUAL",
      "created_at": "2026-01-14T10:10:00Z",
      "updated_at": "2026-01-14T10:10:00Z"
    }
  ],
  "timestamp": "2026-01-14T10:10:00Z",
  "request_id": "req-abc123"
}
```

#### GET /api/plans/:id/runs/:runId (Get Single Run)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b",
    "plan_id": "550e8400-e29b",
    "workout_id": "660e8400-e29b",
    "actual_date": "2025-02-03",
    "distance": "5.20",
    "actual_pace": 361,
    "source": "MANUAL",
    "created_at": "2026-01-14T10:10:00Z",
    "updated_at": "2026-01-14T10:10:00Z"
  },
  "timestamp": "2026-01-14T10:10:00Z",
  "request_id": "req-abc123"
}
```

#### PATCH /api/plans/:id/runs/:runId (Update Run)

**Request (all fields optional):**
```json
{
  "distance": 5.3,
  "actual_pace": 362
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b",
    "plan_id": "550e8400-e29b",
    "workout_id": "660e8400-e29b",
    "actual_date": "2025-02-03",
    "distance": "5.30",
    "actual_pace": 362,
    "source": "MANUAL",
    "created_at": "2026-01-14T10:10:00Z",
    "updated_at": "2026-01-14T10:11:00Z"
  },
  "timestamp": "2026-01-14T10:11:00Z",
  "request_id": "req-abc123"
}
```

#### DELETE /api/plans/:id/runs/:runId (Delete Run)

**Response (204 No Content)**

---

## Validation Rules

### Plan

| Field | Validation Rules | Layer |
|-------|------------------|-------|
| name | Required, string, max 255 chars, unique | API + Service |
| description | Optional, string, max 1000 chars | API |
| start_date | Required, valid date, format YYYY-MM-DD | API |
| end_date | Required, valid date, format YYYY-MM-DD, >= start_date | API + Service |
| status | Enum: DRAFT, ACTIVE, COMPLETED | API |

**Validation Flow:**
1. **API Layer (Zod):** Type, format, required/optional
2. **Service Layer:** Uniqueness of name, date logic (end_date >= start_date)

### Workout

| Field | Validation Rules | Layer |
|-------|------------------|-------|
| plan_id | Required, must exist in Plan table | Service |
| scheduled_date | Optional, valid date format YYYY-MM-DD | API |
| distance | Required, decimal, >= 0.1, <= 100 | API |
| target_pace | Required, integer, >= 180, <= 3000 | API |
| workout_type | Enum: EASY, TEMPO, LONG, SPEED, RECOVERY, CROSS_TRAINING, REST | API |
| description | Optional, string, max 500 chars | API |

**Validation Flow:**
1. **API Layer (Zod):** Type, range, format, enum
2. **Service Layer:** Check plan_id exists, validate business rules

### Run

| Field | Validation Rules | Layer |
|-------|------------------|-------|
| plan_id | Required, must exist in Plan table | Service |
| workout_id | Optional, if provided must exist in Workout table and belong to same plan | Service |
| actual_date | Required, valid date format YYYY-MM-DD | API |
| distance | Required, decimal, >= 0.1, <= 100 | API |
| actual_pace | Required, integer, >= 180, <= 3000 | API |
| source | Enum: MANUAL, STRAVA; defaults to MANUAL | API |

**Validation Flow:**
1. **API Layer (Zod):** Type, range, format, enum
2. **Service Layer:** Check plan_id exists, check workout_id belongs to same plan if provided

---

## Error Handling Strategy

### Error Hierarchy

```
Custom Errors (extend Error):
├── ValidationError (400) — Input validation failed
├── NotFoundError (404) — Resource not found
├── ConflictError (409) — Business rule violation (e.g., duplicate name)
└── InternalError (500) — Unexpected server error
```

### Error Flow

```
HTTP Request
  ↓
[Express Route Handler]
  ↓
[Validate Request (Zod) → throws ValidationError if invalid]
  ↓
[Call Service Method]
  ↓
[Service Layer]
  ├─→ Validate business rules → throws ValidationError/ConflictError if invalid
  ├─→ Call Repository
  └─→ Return domain object or throw NotFoundError
  ↓
[Error Handler Middleware]
  ├─→ Catches ValidationError → 400 response
  ├─→ Catches NotFoundError → 404 response
  ├─→ Catches ConflictError → 409 response
  ├─→ Catches unexpected errors → 500 response
  ├─→ Logs error with request_id
  └─→ Formats error response (defined below)
  ↓
HTTP Response (JSON)
```

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": null or [{ "field": "...", "message": "..." }]
  },
  "timestamp": "2026-01-14T10:00:00Z",
  "request_id": "req-unique-id"
}
```

### Error Codes and HTTP Status

| Code | HTTP Status | When | Example |
|------|-------------|------|---------|
| VALIDATION_ERROR | 400 | Invalid input format or missing required field | `{ "field": "distance", "message": "Must be between 0.1 and 100" }` |
| NOT_FOUND | 404 | Resource doesn't exist | `"Plan with id xyz not found"` |
| CONFLICT | 409 | Business rule violation (e.g., duplicate name) | `"Plan name already exists"` |
| INTERNAL_ERROR | 500 | Unexpected server error | `"Database connection failed"` |

---

## Logging Strategy

### Structured Logging with pino

All logs are structured JSON with consistent fields:

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

### Log Levels

- **INFO:** Request received, operation completed successfully, data created/updated/deleted
- **WARN:** Validation warning, deprecated usage, non-critical issues
- **ERROR:** Caught exception, business rule violated, database error
- **DEBUG:** (Not used in MVP; can add later)

### What to Log

**Every API request:**
```
"Received POST /api/plans" → INFO
├── request_id: unique correlation ID
├── method: HTTP method
├── path: request path
├── timestamp: when received
```

**Successful operations:**
```
"Plan created" → INFO
├── service: PlanService
├── method: createPlan
├── data: { plan_id: "..." }
├── duration_ms: how long it took
```

**Errors:**
```
"Validation error: distance out of range" → WARN
├── service: WorkoutService
├── method: createWorkout
├── error_code: VALIDATION_ERROR
├── error_details: { field: "distance", message: "..." }
├── request_id: correlation ID (to trace from request to error)
```

**Unexpected errors:**
```
"Database query failed" → ERROR
├── service: WorkoutRepository
├── method: findByPlanId
├── error: exception message
├── stack: stack trace
├── request_id: correlation ID
```

### Request ID Generation

1. Generate unique ID on every incoming request (UUID or nanoid)
2. Attach to request context
3. Include in every log for that request
4. Include in every API response (helps client debug)
5. Allows tracing a single user action through all logs

---

## Architecture Decisions

### Decision 1: Separate Services and Repositories

**Context:** Need clear separation of concerns and testability.

**Options Considered:**
- A) Combine services and repositories (less boilerplate, but harder to test)
- B) Separate services (business logic) and repositories (data access) ← **CHOSEN**
- C) No services; call repositories directly from routes (business logic in routes)

**Decision:** Option B

**Rationale:** 
- Services handle all business logic (validation, orchestration)
- Repositories handle only CRUD operations
- Each layer is independently testable (mock repositories, test service logic)
- If database changes, only repositories need updates
- If business rules change, only services need updates
- Cleaner route handlers (no logic bloat)

**Trade-offs:**
- Gain: Testability, maintainability, clarity
- Lose: Slightly more files/boilerplate

---

### Decision 2: Validation in Both API Layer and Service Layer

**Context:** Catch errors early and enforce business rules comprehensively.

**Options Considered:**
- A) Validation only in routes (fast, simple, but business logic can be violated)
- B) Validation only in services (slower to catch, but centralized)
- C) Validation in both routes (format, type) and services (business rules) ← **CHOSEN**

**Decision:** Option C

**Rationale:**
- Routes validate request format (Zod) — catches bad input immediately, gives fast feedback
- Services validate business logic (e.g., uniqueness, relationships) — ensures no invalid state
- If logic is called from another route later, business validation still applies
- Prevents invalid data from ever reaching the database

**Trade-offs:**
- Gain: Defense-in-depth, reusable validation, prevents invalid states
- Lose: Slightly more validation code (but reusable across routes)

---

### Decision 3: Structured Logging with Correlation IDs

**Context:** Need visibility into request flow for debugging and monitoring.

**Options Considered:**
- A) No logging (simplest, but impossible to debug production issues)
- B) Console.log strings (simple, but hard to parse/search)
- C) Structured JSON logging with correlation IDs ← **CHOSEN**

**Decision:** Option C

**Rationale:**
- JSON logs are machine-readable (can parse, search, aggregate)
- Correlation IDs allow tracing one user action through entire system
- Can later plug into log aggregation (Splunk, DataDog, etc.)
- Minimal performance overhead

**Trade-offs:**
- Gain: Debuggability, observability, searchable logs
- Lose: Slightly more setup, larger log files (but more useful)

---

### Decision 4: Cascade Delete Plan → Workouts/Runs

**Context:** Deciding how to handle deleting a plan that has associated workouts and runs.

**Options Considered:**
- A) Cascade delete (deletes all workouts and runs too)
- B) Soft delete (mark as deleted, keep data)
- C) Prevent deletion if workouts exist

**Decision:** Option A (Cascade Delete)

**Rationale:**
- Cleaner data model (no orphaned workouts/runs)
- Simpler for MVP (no soft delete logic)
- If user deletes a plan, they probably want all related data gone
- Database enforces this via foreign key cascade

**Trade-offs:**
- Gain: Clean data, simple logic
- Lose: No recovery of deleted data (acceptable for MVP)
- Risk: User could accidentally delete entire plan. UI should confirm before deletion.

---

### Decision 5: NULL workout_id for Unplanned Runs

**Context:** Supporting unplanned runs (runs logged without an associated planned workout).

**Options Considered:**
- A) Require every run to link to a workout (doesn't match real use case)
- B) Allow nullable workout_id; run exists independently ← **CHOSEN**
- C) Create placeholder workouts for unplanned runs (extra complexity)

**Decision:** Option B

**Rationale:**
- Matches real behavior: sometimes you run without a plan
- Workout can be deleted without deleting the run
- Simpler data model
- Run can exist, show on calendar, even if workout is gone

**Trade-offs:**
- Gain: Flexibility, matches reality
- Lose: Some queries need to handle NULL values

---

### Decision 6: Last-Write-Wins Concurrency

**Context:** No explicit locking or version management (MVP doesn't need multi-user concurrency).

**Options Considered:**
- A) Optimistic locking with version fields (complex for MVP)
- B) Pessimistic locking (complex database setup)
- C) Last-write-wins (simplest, acceptable for single-user MVP) ← **CHOSEN**

**Decision:** Option C

**Rationale:**
- Single-user MVP doesn't have concurrent edits
- Last update timestamp is auto-managed by Prisma
- If concurrency becomes an issue later, can add versioning

**Trade-offs:**
- Gain: Simple, no extra code
- Lose: No conflict detection (acceptable for MVP)

---

## Implementation Sequence

The developer must build in this order (dependencies flow top-to-bottom):

### Phase 1: Project Setup & Configuration
1. Initialize Next.js 14 project with TypeScript
2. Install dependencies (Prisma, Zod, pino, Jest, testing libraries)
3. Configure TypeScript (tsconfig.json)
4. Configure Jest for unit/integration tests
5. Create .env.local with SQL Server connection string
6. Set up pino logger singleton in `/lib/utils/logger.ts`

### Phase 2: Database Schema & Types
7. Write Prisma schema (`prisma/schema.prisma`) with Plan, Workout, Run models
8. Run `prisma migrate dev --name init` to create database tables
9. Generate Prisma types (`prisma generate`)
10. Create TypeScript type definitions (`/src/types/*.types.ts`)
11. Create test fixtures (`/tests/fixtures/*.fixtures.ts`)

### Phase 3: Validation & Utilities
12. Create Zod validators (`/lib/validators/*.validator.ts`)
13. Create custom error classes (`/lib/utils/errors.ts`)
14. Create response formatter (`/lib/utils/response.ts`)
15. Test validators with unit tests (`/tests/unit/validators/`)

### Phase 4: Data Access Layer
16. Create repositories (`/lib/repositories/*.repository.ts`) with CRUD methods:
    - `create(data)` → creates record, returns domain object
    - `findById(id)` → returns domain object or null
    - `findAll()` → returns array of domain objects
    - `update(id, data)` → updates record, returns updated object
    - `delete(id)` → deletes record, returns boolean
    - Additional queries as needed (e.g., `findByPlanId`)
17. Unit test repositories (`/tests/unit/repositories/`) with mocked Prisma

### Phase 5: Business Logic Layer
18. Create services (`/lib/services/*.service.ts`):
    - `PlanService`: createPlan, getPlan, listPlans, updatePlan, deletePlan
    - `WorkoutService`: createWorkout, getWorkout, listByPlan, updateWorkout, deleteWorkout
    - `RunService`: createRun, getRun, listByPlan, updateRun, deleteRun
19. Each service calls repositories and validates business rules
20. Throw custom errors (ValidationError, NotFoundError, ConflictError) on violations
21. Unit test services (`/tests/unit/services/`) with mocked repositories

### Phase 6: API Routes
22. Create route handlers (`/app/api/plans/route.ts`, etc.) for POST and GET
23. Each handler: validate input → call service → format response
24. Error handling: try/catch, format error response, log
25. Create nested dynamic routes for `:id/workouts`, `:id/runs`, etc.
26. Integration test routes (`/tests/integration/plans.integration.test.ts`, etc.)

### Phase 7: Error Handling & Logging
27. Create global error handler middleware (or use Next.js error.ts)
28. Every route wraps service calls in try/catch
29. Add request ID generation on every request
30. Add structured logging to services and repositories
31. Test error scenarios (404, 400, 409, 500)

### Phase 8: Testing
32. Run all unit tests (services, repositories, validators)
33. Run all integration tests (routes end-to-end)
34. Happy path: create plan → create workout → create run → read → update → delete
35. Error paths: invalid input, missing resources, duplicate names
36. Ensure test coverage >= 80%

### Phase 9: Final Verification
37. Postman or curl tests for all 15 endpoints
38. Verify error responses match spec (code, message, details)
39. Verify request_id included in all responses
40. Verify timestamps in correct format
41. Verify cascade delete works (delete plan → workouts/runs gone)

---

## Key Data Transformations

### Prisma Output → API Response

Prisma returns camelCase; API returns snake_case. Create a mapper utility:

```typescript
// /lib/utils/mappers.ts

export const mapPlan = (prismaObject: any): Plan => ({
  id: prismaObject.id,
  name: prismaObject.name,
  description: prismaObject.description,
  start_date: prismaObject.startDate.toISOString().split('T')[0],
  end_date: prismaObject.endDate.toISOString().split('T')[0],
  status: prismaObject.status,
  created_at: prismaObject.createdAt.toISOString(),
  updated_at: prismaObject.updatedAt.toISOString(),
});

// Similarly for Workout, Run
```

**Why:** API contract specifies snake_case; Prisma/JavaScript use camelCase. One mapper function ensures consistency.

---

## Testing Strategy

### Unit Tests (Services & Repositories)

**Service Unit Tests:** Test business logic in isolation (mock repositories)

```typescript
describe('PlanService', () => {
  it('should create a plan with valid input', async () => {
    const mockRepo = { create: jest.fn().mockResolvedValue(...) };
    const service = new PlanService(mockRepo);
    const result = await service.createPlan({...});
    expect(result).toEqual({...});
  });

  it('should throw ValidationError if end_date < start_date', async () => {
    const service = new PlanService(mockRepo);
    expect(() => service.createPlan({ end_date: '2025-01-01', start_date: '2025-02-01' }))
      .toThrow(ValidationError);
  });
});
```

**Repository Unit Tests:** Test CRUD operations (mock Prisma)

```typescript
describe('PlanRepository', () => {
  it('should create a plan and return it', async () => {
    const mockPrisma = { plan: { create: jest.fn().mockResolvedValue(...) } };
    const repo = new PlanRepository(mockPrisma);
    const result = await repo.create({...});
    expect(result.name).toBe('Test Plan');
  });
});
```

### Integration Tests (Routes)

**End-to-end tests via HTTP:** Create test plans, workouts, runs; verify responses and database state.

```typescript
describe('POST /api/plans', () => {
  it('should create a plan and return 201', async () => {
    const response = await fetch('http://localhost:3000/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', start_date: '2025-01-01', end_date: '2025-02-01' }),
    });
    expect(response.status).toBe(201);
    expect(response.json().data.id).toBeDefined();
  });

  it('should return 400 if end_date < start_date', async () => {
    const response = await fetch('http://localhost:3000/api/plans', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', start_date: '2025-02-01', end_date: '2025-01-01' }),
    });
    expect(response.status).toBe(400);
    expect(response.json().error.code).toBe('VALIDATION_ERROR');
  });
});
```

### Test Coverage Goals

- **Services:** 100% coverage (all validation paths, error cases)
- **Repositories:** 90% coverage (CRUD operations)
- **Routes:** 80% coverage (happy path + main error cases)
- **Overall:** >= 80% code coverage

### Testing Tools

- **Jest:** Test runner, assertions
- **ts-jest:** TypeScript support for Jest
- **jest-mock-extended:** Better Prisma mocking
- **supertest:** HTTP request testing (optional; fetch works too)

---

## Open Questions for Implementer

1. **Database Setup:** Do you have a local SQL Server instance running, or should we use a Docker container?
2. **Testing Database:** Should tests use an in-memory database or a separate test database?
3. **Env Variables:** Where should `.env.local` be stored? (Git-ignored, should not be committed)
4. **API Documentation:** Should we add Swagger/OpenAPI documentation? (Can be added after MVP)
5. **Logging Output:** Should logs go to console, file, or both? (Console is fine for MVP)

---

## Assumptions Made

| Assumption | Rationale | Validate? |
|-----------|-----------|-----------|
| Single-user system (no authentication) | MVP requirement; simplifies security/permissions | ✅ Confirmed in requirements |
| Hard delete is acceptable (no soft deletes) | MVP timeline; data recovery not required | ✅ Confirmed in requirements |
| Cascade delete Plan → Workouts/Runs | Cleaner data model; UI should warn before deletion | ⚠️ Confirm UI prevents accidental deletion |
| Last-write-wins concurrency | Single-user MVP; not multi-concurrent | ✅ Confirmed in requirements |
| Runs can exist without workouts | Matches real use case (unplanned runs) | ✅ Confirmed in requirements |
| All distance/pace values are numeric decimals/integers | Easier calculation/querying than strings | ✅ Confirmed in requirements |
| No pagination needed for MVP | Datasets are small (few hundred plans) | ✅ Assumed; can add later if needed |
| Request IDs are UUIDs or nanoids | Standard practice; unique per request | ✅ Can adjust if preference differs |
| Timestamps are ISO 8601 format (UTC) | Standard; simplifies client parsing | ✅ Can adjust if preference differs |

---

## Deployment Notes (Future)

For production deployment:
- Use environment variables for database connection (don't hardcode)
- Set up SQL Server backups
- Monitor logs via log aggregation service
- Add API rate limiting (if needed later)
- Add authentication/user isolation (if adding multi-user)
- Consider caching endpoints (GET /api/plans, etc.)

For MVP, local development is sufficient.

---

## Next Steps

1. **Developer reviews this architecture:**
   - Confirms understanding of folder structure
   - Confirms understanding of data model and relationships
   - Confirms understanding of error handling flow
   - Asks clarifying questions

2. **Developer builds in sequence:**
   - Phase 1: Project setup (1-2 hours)
   - Phase 2: Database schema (1-2 hours)
   - Phase 3: Validation & utils (30 min)
   - Phase 4: Repositories (2-3 hours)
   - Phase 5: Services (2-3 hours)
   - Phase 6: Routes (3-4 hours)
   - Phase 7: Error handling (1-2 hours)
   - Phase 8: Testing (4-5 hours)
   - Phase 9: Verification (1-2 hours)

3. **Total estimate:** 16-24 hours of focused development (feasible in one night with breaks)

4. **Quality gate:**
   - All tests pass
   - All 15 endpoints respond correctly
   - Error responses match spec
   - Database cascades work as expected
   - Logs are structured and searchable
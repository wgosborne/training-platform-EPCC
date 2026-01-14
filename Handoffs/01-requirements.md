# Requirements: Running Trainer MVP Microservice

**Tech Stack:** Next.js 14+ | Prisma ORM | SQL Server | TypeScript
**Scope:** Single-user monolith with modular API routes
**Timeline:** MVP for deployment tomorrow
**Date Created:** January 14, 2026

---

## Problem Statement

You're a runner training for races (e.g., St. Jude Half Marathon 2025). You need a way to:
1. **Create training plans** - Multi-week plans with a start and end date
2. **Schedule workouts** - Individual workouts within plans (distance, pace, type, date)
3. **Log actual runs** - Track what you actually ran (may differ from planned workouts)
4. **View progress** - See planned vs. actual on a calendar

The system tracks the *plan* (what you intended) separate from the *reality* (what you actually did), so you can compare and iterate.

---

## Functional Requirements

### Core Entities

#### 1. Plan
A multi-week training program with a start and end date.

**Attributes:**
- `id` (UUID, auto-generated, primary key)
- `name` (string, required, unique per user, max 255 chars) — e.g., "St. Jude Half Marathon 2025"
- `description` (text, optional) — e.g., "12-week training plan with long runs on Saturdays"
- `start_date` (date, required) — First day of the plan
- `end_date` (date, required) — Last day of the plan
- `status` (enum: DRAFT | ACTIVE | COMPLETED, default: DRAFT)
- `created_at` (timestamp, auto-generated)
- `updated_at` (timestamp, auto-updated)

**Business Rules:**
- `end_date` must be >= `start_date`
- Deleting a Plan cascades to delete all associated Workouts and Runs
- Only one user per system (MVP), so no user_id field needed

---

#### 2. Workout
A scheduled workout within a Plan.

**Attributes:**
- `id` (UUID, auto-generated, primary key)
- `plan_id` (UUID, foreign key to Plan, required)
- `scheduled_date` (date, optional) — The day this workout is scheduled for
- `distance` (decimal, required) — Miles to run (e.g., 5.2)
- `target_pace` (integer, required) — Seconds per mile (e.g., 360 = 6:00 per mile)
- `workout_type` (enum: EASY | TEMPO | LONG | SPEED | RECOVERY | CROSS_TRAINING | REST, required)
- `description` (text, optional)
- `created_at` (timestamp, auto-generated)
- `updated_at` (timestamp, auto-updated)

**Business Rules:**
- `scheduled_date` can be NULL (unscheduled workouts appear only in list view, not calendar)
- Multiple workouts can share the same `scheduled_date`
- Deleting a Workout does NOT cascade to Runs (a Run can exist without a Workout)
- Distance must be >= 0.1 and <= 100 miles
- Pace must be >= 180 seconds/mile (3:00/mile) and <= 3000 seconds/mile (50:00/mile)

---

#### 3. Run
An actual run that was logged, optionally linked to a Workout.

**Attributes:**
- `id` (UUID, auto-generated, primary key)
- `plan_id` (UUID, foreign key to Plan, required)
- `workout_id` (UUID, foreign key to Workout, optional, nullable)
- `actual_date` (date, required) — The day this run was logged
- `distance` (decimal, required) — Actual miles run
- `actual_pace` (integer, required) — Actual seconds per mile
- `source` (enum: MANUAL | STRAVA, default: MANUAL for MVP)
- `created_at` (timestamp, auto-generated)
- `updated_at` (timestamp, auto-updated)

**Business Rules:**
- A Run can exist without being linked to a Workout (`workout_id` can be NULL)
- A Run linked to a Workout does NOT override the Workout; both exist independently
- `actual_date` can be any date within the Plan's date range (or technically outside, but UI may guide otherwise)
- Multiple Runs can be logged on the same day
- Distance must be >= 0.1 and <= 100 miles
- Pace must be >= 180 seconds/mile and <= 3000 seconds/mile
- Deleting a Run is independent (does not affect Workout or Plan)

---

### CRUD Operations

#### CREATE - Plan

**Endpoint:** `POST /api/plans`

**Request Body:**
```json
{
  "name": "St. Jude Half Marathon 2025",
  "description": "12-week training plan",
  "start_date": "2025-02-01",
  "end_date": "2025-04-27",
  "status": "DRAFT"
}
```

**Required Fields:** `name`, `start_date`, `end_date`
**Optional Fields:** `description`, `status` (defaults to DRAFT)

**Validation:**
- `name` must not be empty
- `end_date` >= `start_date`
- Both dates must be valid date format (YYYY-MM-DD)

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "St. Jude Half Marathon 2025",
  "description": "12-week training plan",
  "start_date": "2025-02-01",
  "end_date": "2025-04-27",
  "status": "DRAFT",
  "created_at": "2026-01-14T10:00:00Z",
  "updated_at": "2026-01-14T10:00:00Z"
}
```

**Frequency:** Occasional (a few times per year)

---

#### CREATE - Workout

**Endpoint:** `POST /api/plans/{plan_id}/workouts`

**Request Body:**
```json
{
  "scheduled_date": "2025-02-03",
  "distance": 5.2,
  "target_pace": 360,
  "workout_type": "EASY",
  "description": "Easy 5-miler to start the week"
}
```

**Required Fields:** `distance`, `target_pace`, `workout_type`
**Optional Fields:** `scheduled_date`, `description`

**Validation:**
- `distance` must be between 0.1 and 100
- `target_pace` must be between 180 and 3000 seconds
- `scheduled_date` (if provided) must be within the Plan's date range (or at least not before start_date)
- `workout_type` must be a valid enum value

**Response (201 Created):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "scheduled_date": "2025-02-03",
  "distance": 5.2,
  "target_pace": 360,
  "workout_type": "EASY",
  "description": "Easy 5-miler to start the week",
  "created_at": "2026-01-14T10:05:00Z",
  "updated_at": "2026-01-14T10:05:00Z"
}
```

**Error Scenarios:**
- `plan_id` does not exist → 404 Not Found
- Invalid `workout_type` → 400 Bad Request
- Distance/pace out of range → 400 Bad Request

**Frequency:** Frequent (creating multiple workouts per plan)

---

#### CREATE - Run

**Endpoint:** `POST /api/plans/{plan_id}/runs`

**Request Body:**
```json
{
  "workout_id": "660e8400-e29b-41d4-a716-446655440001",
  "actual_date": "2025-02-03",
  "distance": 5.2,
  "actual_pace": 361,
  "source": "MANUAL"
}
```

Or without a workout (unplanned run):
```json
{
  "actual_date": "2025-02-04",
  "distance": 3.0,
  "actual_pace": 420,
  "source": "MANUAL"
}
```

**Required Fields:** `actual_date`, `distance`, `actual_pace`
**Optional Fields:** `workout_id`, `source` (defaults to MANUAL)

**Validation:**
- `distance` must be between 0.1 and 100
- `actual_pace` must be between 180 and 3000 seconds
- `actual_date` must be a valid date
- If `workout_id` provided, it must exist and belong to the same `plan_id`

**Response (201 Created):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "workout_id": "660e8400-e29b-41d4-a716-446655440001",
  "actual_date": "2025-02-03",
  "distance": 5.2,
  "actual_pace": 361,
  "source": "MANUAL",
  "created_at": "2026-01-14T10:10:00Z",
  "updated_at": "2026-01-14T10:10:00Z"
}
```

**Frequency:** Frequent (every run you do)

---

#### READ - Single Plan

**Endpoint:** `GET /api/plans/{plan_id}`

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "St. Jude Half Marathon 2025",
  "description": "12-week training plan",
  "start_date": "2025-02-01",
  "end_date": "2025-04-27",
  "status": "ACTIVE",
  "created_at": "2026-01-14T10:00:00Z",
  "updated_at": "2026-01-14T10:00:00Z"
}
```

**Error:** `plan_id` does not exist → 404 Not Found

**Frequency:** Frequent

---

#### READ - List All Plans

**Endpoint:** `GET /api/plans`

**Query Parameters:** None for MVP (no filtering/sorting)

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "St. Jude Half Marathon 2025",
    "description": "12-week training plan",
    "start_date": "2025-02-01",
    "end_date": "2025-04-27",
    "status": "ACTIVE",
    "created_at": "2026-01-14T10:00:00Z",
    "updated_at": "2026-01-14T10:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Local 5K Race 2025",
    "description": null,
    "start_date": "2025-05-01",
    "end_date": "2025-05-31",
    "status": "DRAFT",
    "created_at": "2026-01-14T10:15:00Z",
    "updated_at": "2026-01-14T10:15:00Z"
  }
]
```

**Frequency:** Every time the Plans card view loads

---

#### READ - Workouts for a Plan

**Endpoint:** `GET /api/plans/{plan_id}/workouts`

**Response (200 OK):**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "plan_id": "550e8400-e29b-41d4-a716-446655440000",
    "scheduled_date": "2025-02-03",
    "distance": 5.2,
    "target_pace": 360,
    "workout_type": "EASY",
    "description": "Easy 5-miler",
    "created_at": "2026-01-14T10:05:00Z",
    "updated_at": "2026-01-14T10:05:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440002",
    "plan_id": "550e8400-e29b-41d4-a716-446655440000",
    "scheduled_date": null,
    "distance": 8.0,
    "target_pace": 420,
    "workout_type": "LONG",
    "description": "Long run (to be scheduled)",
    "created_at": "2026-01-14T10:06:00Z",
    "updated_at": "2026-01-14T10:06:00Z"
  }
]
```

**UI Interpretation:**
- Workouts with `scheduled_date` show on calendar
- Workouts with `scheduled_date: null` show in a separate list below the calendar

**Frequency:** When viewing a Plan's detail page

---

#### READ - Runs for a Plan

**Endpoint:** `GET /api/plans/{plan_id}/runs`

**Response (200 OK):**
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "plan_id": "550e8400-e29b-41d4-a716-446655440000",
    "workout_id": "660e8400-e29b-41d4-a716-446655440001",
    "actual_date": "2025-02-03",
    "distance": 5.2,
    "actual_pace": 361,
    "source": "MANUAL",
    "created_at": "2026-01-14T10:10:00Z",
    "updated_at": "2026-01-14T10:10:00Z"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440003",
    "plan_id": "550e8400-e29b-41d4-a716-446655440000",
    "workout_id": null,
    "actual_date": "2025-02-04",
    "distance": 3.0,
    "actual_pace": 420,
    "source": "MANUAL",
    "created_at": "2026-01-14T10:15:00Z",
    "updated_at": "2026-01-14T10:15:00Z"
  }
]
```

**UI Interpretation:**
- Runs show on the same calendar day as their `actual_date`
- Multiple runs on the same day all appear together
- Runs linked to a Workout show that relationship
- Unlinked runs (unplanned) also show on the calendar

**Frequency:** When viewing a Plan's detail page

---

#### READ - Single Workout

**Endpoint:** `GET /api/plans/{plan_id}/workouts/{workout_id}`

**Response (200 OK):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "scheduled_date": "2025-02-03",
  "distance": 5.2,
  "target_pace": 360,
  "workout_type": "EASY",
  "description": "Easy 5-miler",
  "created_at": "2026-01-14T10:05:00Z",
  "updated_at": "2026-01-14T10:05:00Z"
}
```

**Error:** Workout not found → 404 Not Found

**Frequency:** When user clicks on a workout to view/edit details

---

#### READ - Single Run

**Endpoint:** `GET /api/plans/{plan_id}/runs/{run_id}`

**Response (200 OK):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "workout_id": "660e8400-e29b-41d4-a716-446655440001",
  "actual_date": "2025-02-03",
  "distance": 5.2,
  "actual_pace": 361,
  "source": "MANUAL",
  "created_at": "2026-01-14T10:10:00Z",
  "updated_at": "2026-01-14T10:10:00Z"
}
```

**Frequency:** When user clicks on a run to view/edit details

---

#### UPDATE - Plan

**Endpoint:** `PATCH /api/plans/{plan_id}`

**Request Body (all fields optional):**
```json
{
  "name": "St. Jude Half Marathon 2025 - Updated",
  "description": "Updated 12-week plan",
  "status": "ACTIVE",
  "end_date": "2025-05-01"
}
```

**Updatable Fields:** `name`, `description`, `status`, `start_date`, `end_date`

**Validation:**
- `end_date` must still be >= `start_date`
- `name` must not be empty

**Response (200 OK):** Updated Plan object

**Error:** Plan not found → 404 Not Found

**Frequency:** Occasional (changing plan details)

---

#### UPDATE - Workout

**Endpoint:** `PATCH /api/plans/{plan_id}/workouts/{workout_id}`

**Request Body (all fields optional):**
```json
{
  "scheduled_date": "2025-02-04",
  "distance": 5.5,
  "target_pace": 365,
  "description": "Easy 5.5-miler"
}
```

**Updatable Fields:** `scheduled_date`, `distance`, `target_pace`, `workout_type`, `description`

**Validation:**
- Same as CREATE validation for distance/pace
- `scheduled_date` can be NULL (to unschedule)

**Response (200 OK):** Updated Workout object

**Error:** Workout not found → 404 Not Found

**Frequency:** Occasional (adjusting workout details)

---

#### UPDATE - Run

**Endpoint:** `PATCH /api/plans/{plan_id}/runs/{run_id}`

**Request Body (all fields optional):**
```json
{
  "actual_date": "2025-02-04",
  "distance": 5.3,
  "actual_pace": 362
}
```

**Updatable Fields:** `actual_date`, `distance`, `actual_pace`, `workout_id`, `source`

**Validation:**
- Same as CREATE validation for distance/pace

**Response (200 OK):** Updated Run object

**Error:** Run not found → 404 Not Found

**Frequency:** Occasional (correcting logged run data)

---

#### DELETE - Plan

**Endpoint:** `DELETE /api/plans/{plan_id}`

**Response (204 No Content)**

**Cascade Behavior:** Deletes all associated Workouts and Runs

**Error:** Plan not found → 404 Not Found

**Frequency:** Rare

---

#### DELETE - Workout

**Endpoint:** `DELETE /api/plans/{plan_id}/workouts/{workout_id}`

**Response (204 No Content)**

**Cascade Behavior:** Runs linked to this Workout remain in the system (just lose the `workout_id` reference)

**Error:** Workout not found → 404 Not Found

**Frequency:** Occasional

---

#### DELETE - Run

**Endpoint:** `DELETE /api/plans/{plan_id}/runs/{run_id}`

**Response (204 No Content)**

**No cascading effects.

**Error:** Run not found → 404 Not Found

**Frequency:** Occasional (removing incorrectly logged runs)

---

## Non-Functional Requirements

### Performance
- API responses should complete in < 200ms for single read/write operations
- List endpoints (GET /api/plans, GET /api/plans/{id}/workouts) should complete in < 300ms
- Database queries should use appropriate indexes (on `plan_id`, `scheduled_date`, `actual_date`)

### Scale
- MVP is single-user (no concurrent user considerations)
- Expected data volume: a few hundred plans, a few thousand workouts/runs
- No pagination required for MVP (assume lists are small)

### Security
- No authentication for MVP (single-user, local/trusted use)
- All API endpoints callable from external tools (Postman, curl)
- No sensitive data requiring encryption

### Reliability
- No specific uptime requirement for MVP
- Data loss is unacceptable (all changes should persist to SQL Server)
- Hard deletes are acceptable (no recovery requirement)

### Database
- SQL Server (local or cloud)
- Prisma ORM for all database operations
- Auto-generated migrations for schema changes

---

## Edge Cases & Risk Scenarios

| Scenario | Impact | How to Handle |
|----------|--------|---------------|
| User submits invalid distance (e.g., -5) | High | Reject with 400 Bad Request, return validation error message |
| User submits pace outside range (e.g., 5000 sec/mile) | High | Reject with 400 Bad Request |
| User tries to create workout with end_date < start_date | High | Reject with 400 Bad Request |
| User tries to delete a Plan that has Workouts/Runs | Medium | Delete cascades; may want confirmation in UI but API allows it |
| User submits scheduled_date outside Plan's date range | Medium | For MVP, allow it (let UI handle guidance) |
| User logs Run on different day than Workout | Low | Allowed by design; both show on calendar independently |
| User logs multiple Runs on same day | Low | Allowed; all show on calendar |
| User deletes Workout; Runs linked to it remain | Low | By design; Runs just have NULL workout_id |
| Concurrent updates to same entity | Low | Last write wins (Prisma default) |
| Database connection fails | Critical | Return 500 error; connection should retry automatically |
| Invalid date format in request (e.g., "2025-13-01") | High | Reject with 400 Bad Request |

---

## Open Questions
- None; all requirements clarified

---

## Constraints

| Category | Constraint |
|----------|-----------|
| **Timeline** | MVP due tomorrow (January 14, 2026) |
| **Technology** | Next.js + Prisma + SQL Server (no alternatives for MVP) |
| **Users** | Single user only (no multi-user logic) |
| **Deployment** | Local development for now |
| **UI Polish** | Bare-bones functional only (no styling requirement) |

---

## Assumptions Made

| Assumption | Rationale | Validate? |
|-----------|-----------|-----------|
| Pace stored as integers (seconds/mile) for consistency | Easier to store and calculate than string format | ✅ Confirmed |
| Hard delete for all entities | Fast for MVP; can add soft deletes later | ✅ Confirmed |
| No authentication/user tracking | Single-user system for MVP | ✅ Confirmed |
| Cascade delete Plan → Workouts/Runs | Cleaner than orphaned data | ✅ Assumed, but should confirm UI doesn't allow accidental deletion |
| Runs can exist without Workouts | Supports unplanned runs | ✅ Confirmed |
| Multiple runs same day allowed | Supports tracking multiple sessions | ✅ Confirmed |
| No pagination needed | MVP will have small datasets | ✅ Assumed, can add later |

---

## Summary for Development

### API Endpoints (14 total)

**Plans (5):**
- `POST /api/plans` — Create
- `GET /api/plans` — List all
- `GET /api/plans/{id}` — Get one
- `PATCH /api/plans/{id}` — Update
- `DELETE /api/plans/{id}` — Delete

**Workouts (5):**
- `POST /api/plans/{plan_id}/workouts` — Create
- `GET /api/plans/{plan_id}/workouts` — List for plan
- `GET /api/plans/{plan_id}/workouts/{id}` — Get one
- `PATCH /api/plans/{plan_id}/workouts/{id}` — Update
- `DELETE /api/plans/{plan_id}/workouts/{id}` — Delete

**Runs (4):**
- `POST /api/plans/{plan_id}/runs` — Create
- `GET /api/plans/{plan_id}/runs` — List for plan
- `GET /api/plans/{plan_id}/runs/{id}` — Get one
- `PATCH /api/plans/{plan_id}/runs/{id}` — Update
- `DELETE /api/plans/{plan_id}/runs/{id}` — Delete

### Database Tables (3)

- `Plan` — start_date, end_date, status, name, description
- `Workout` — plan_id, scheduled_date, distance, target_pace, workout_type, description
- `Run` — plan_id, workout_id (nullable), actual_date, distance, actual_pace, source

### UI Screens (Minimum 5)

1. **Plans List View** — Cards showing all plans with name, dates, status
2. **Plan Detail View** — Calendar showing scheduled Workouts and logged Runs + unscheduled workouts list below
3. **Workout Detail View** — Edit/delete form for a single workout
4. **Run Detail View** — Edit/delete form for a single run
5. **Create Workout Form** — Create new workout for a plan
6. **Create Run Form** — Create new run for a plan (with optional workout link)
7. **Create Plan Form** — Create new plan

---

## Next Steps

1. ✅ **Requirements locked** (this document)
2. ⏳ **Database schema** — Prisma schema.prisma file with three models
3. ⏳ **API routes** — Next.js /api/* routes for all 14 endpoints
4. ⏳ **UI pages** — React components for the 7 screens above
5. ⏳ **Testing** — Basic happy-path testing via Postman

**Ready to build!**
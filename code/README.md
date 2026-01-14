# Running Trainer MVP

A microservice for training plan management built with Next.js, Prisma, and SQL Server.

## Quick Start

### 1. Set Up Database

1. Create a SQL Server database named `running_trainer`
2. Copy `.env.example` to `.env.local`
3. Update `.env.local` with your SQL Server connection string

```bash
cp .env.example .env.local
```

Example `.env.local`:
```
DATABASE_URL=sqlserver://sa:YourPassword@localhost:1433/running_trainer?encrypt=true&trustServerCertificate=true
NODE_ENV=development
LOG_LEVEL=info
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Prisma Migrations

```bash
npm run prisma:migrate
```

This will create all tables in your SQL Server database.

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# With coverage
npm test:coverage
```

## API Endpoints

### Plans
- `POST /api/plans` - Create plan
- `GET /api/plans` - List all plans
- `GET /api/plans/:id` - Get single plan
- `PATCH /api/plans/:id` - Update plan
- `DELETE /api/plans/:id` - Delete plan

### Workouts
- `POST /api/plans/:id/workouts` - Create workout
- `GET /api/plans/:id/workouts` - List workouts
- `GET /api/plans/:id/workouts/:workoutId` - Get single workout
- `PATCH /api/plans/:id/workouts/:workoutId` - Update workout
- `DELETE /api/plans/:id/workouts/:workoutId` - Delete workout

### Runs
- `POST /api/plans/:id/runs` - Create run
- `GET /api/plans/:id/runs` - List runs
- `GET /api/plans/:id/runs/:runId` - Get single run
- `PATCH /api/plans/:id/runs/:runId` - Update run
- `DELETE /api/plans/:id/runs/:runId` - Delete run

## Project Structure

```
src/
├── lib/
│   ├── services/          # Business logic
│   ├── repositories/      # Data access
│   ├── validators/        # Zod schemas
│   └── utils/            # Utilities (logger, errors, response formatting)
├── app/
│   └── api/              # Next.js API routes
└── types/                # TypeScript type definitions
prisma/
├── schema.prisma         # Database schema
└── migrations/           # Auto-generated migrations
tests/
├── unit/                 # Unit tests
├── integration/          # Integration tests
└── fixtures/             # Test data
```

## Technology Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Database:** SQL Server + Prisma ORM
- **Validation:** Zod
- **Logging:** pino
- **Testing:** Jest + React Testing Library

## Development

### Generate Types from Schema

```bash
npm run prisma:generate
```

### View Database

```bash
npm run prisma:studio
```

Opens Prisma Studio to visually manage your database.

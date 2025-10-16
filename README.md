# Task Management System - TDD Exercise

A test-driven development project demonstrating ORM best practices, unit testing, and proper Git workflow.

## Domain

A simple task management system where users can create, assign, and complete tasks with business rules enforced.

## Features

### F1: Create Task with Priority Validation
**Rule**: A task can only be created with priority 'high' if the user has fewer than 3 active high-priority tasks.

### F2: Complete Task with Time Tracking
**Rule**: When completing a task, it must be marked with completion timestamp and cannot be completed twice.

### F3: Assign Task with Availability Check
**Rule**: A task can only be assigned to a user if that user has fewer than 10 active tasks.

## Technology Stack

- **Runtime**: Bun
- **Testing**: Jest
- **ORM**: Prisma
- **Database**: SQLite
- **Language**: JavaScript

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

The default configuration uses SQLite with a local database file.

### 3. Run Migrations

Initialize the database and run all migrations:

```bash
bun run db:migrate
```

Or use Prisma directly:

```bash
bunx prisma migrate dev
```

### 4. Generate Prisma Client

```bash
bun run db:generate
```

## Running Tests

### Run all tests:

```bash
bun test
```

### Run tests with coverage:

```bash
bun run test:coverage
```

### Run tests in watch mode:

```bash
bun run test:watch
```

## Database Commands

### View database in Prisma Studio:

```bash
bun run db:studio
```

### Reset database (clear all data and re-run migrations):

```bash
bun run db:reset
```

### Create a new migration:

```bash
bunx prisma migrate dev --name <migration_name>
```

## Project Structure

```
testjuhitudarendus/
├── src/
│   ├── services/         # Business logic
│   ├── repositories/     # Data access layer
│   └── utils/            # Helpers (clock provider, etc.)
├── tests/
│   ├── unit/             # Unit tests per feature
│   └── helpers/          # Test utilities
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration files
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment template
├── jest.config.js        # Jest configuration
├── package.json          # Dependencies and scripts
├── PLAN.md               # Implementation plan
└── README.md             # This file
```

## Git Workflow

This project follows TDD (Test-Driven Development) with strict Git discipline:

### Branch Strategy:
- `main` - stable branch
- `feature/<description>` - one branch per functionality

### Commit Pattern (per feature):
1. **red**: Write failing tests only
2. **green**: Minimal code to make tests pass
3. **refactor**: Clean up code, tests stay green

### Merge Rules:
- Use merge commits with `--no-ff` (NOT squash)
- Keep feature branches (do NOT delete after merge)
- History must clearly show red→green→refactor pattern

## Development Guidelines

### TDD Process:
1. Write failing test (RED)
2. Write minimal code to pass (GREEN)
3. Refactor while keeping tests green (REFACTOR)
4. Commit after each phase

### Testing Best Practices:
- Test behavior, not implementation
- Use descriptive test names: "should <behavior> when <condition>"
- Mock external dependencies (time, database)
- Clear database between tests
- Aim for ≥70% code coverage

### ORM Best Practices:
- Schema reflects domain rules
- Use unique constraints and foreign keys
- Enums for status and priority
- Transactions for multi-table operations
- Proper migrations from scratch

## License

This is an educational project for demonstrating TDD practices.

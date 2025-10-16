# Task Management System - TDD

A test-driven development project demonstrating ORM best practices, unit testing, and proper Git workflow.

## Domain Description

This project implements a Task Management System with three core business rules:

### Feature 1: Task Creation with Priority Validation
**Business Rule:** A user can have a maximum of 3 active HIGH priority tasks at any time.

**Rationale:** This prevents users from overwhelming themselves by marking too many tasks as critical, ensuring proper prioritization and focus.

### Feature 2: Task Completion with Time Tracking
**Business Rule:** Only ACTIVE tasks can be completed, and the completion timestamp must be recorded accurately.

**Rationale:** Maintains accurate task history and prevents double-completion. Completed and cancelled tasks cannot be marked as completed again.

### Feature 3: Task Assignment with Availability Check
**Business Rule:** A user cannot be assigned more than 10 active tasks simultaneously.

**Rationale:** Prevents workload overflow and ensures reasonable task distribution across team members.

## Technology Stack

- **Runtime**: Bun
- **Testing**: Bun Test Runner
- **ORM**: Prisma
- **Database**: SQLite
- **Language**: JavaScript

## Quick Start

**One command to setup and start:**

```bash
bun run setup
```

This will automatically create .env file, install dependencies, run migrations, and start the server at http://localhost:3000

---

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

# Task Management System - TDD 

## Technology Stack

- **Runtime**: Bun
- **Testing**: Jest
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

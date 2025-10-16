import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { getTestDb, clearDatabase, closeDatabase } from '../helpers/testDatabase.js';

describe('Feature 4: REST API Endpoints', () => {
  let db;
  let server;
  const BASE_URL = 'http://localhost:3001';

  beforeAll(async () => {
    db = getTestDb();
    await clearDatabase();

    // Import and start server (will be implemented)
    const { startServer } = await import('../../src/server.js');
    server = await startServer(3001, db);
  });

  afterAll(async () => {
    if (server) {
      server.stop();
    }
    await closeDatabase();
  });

  test('should create a new user via POST /api/users', async () => {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
      }),
    });

    expect(response.status).toBe(200);
    const user = await response.json();
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
    expect(user.id).toBeDefined();
  });

  test('should get all users via GET /api/users', async () => {
    // Create a user first
    await db.user.create({
      data: { name: 'Jane Doe', email: 'jane@example.com' },
    });

    const response = await fetch(`${BASE_URL}/api/users`);
    expect(response.status).toBe(200);

    const users = await response.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  test('should create a task via POST /api/tasks', async () => {
    const user = await db.user.create({
      data: { name: 'Task Owner', email: 'owner@example.com' },
    });

    const response = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        title: 'Test Task',
        description: 'Test Description',
        priority: 'MEDIUM',
      }),
    });

    expect(response.status).toBe(200);
    const task = await response.json();
    expect(task.title).toBe('Test Task');
    expect(task.priority).toBe('MEDIUM');
  });

  test('should return 400 when creating high-priority task exceeds limit', async () => {
    const user = await db.user.create({
      data: { name: 'Busy User', email: 'busy@example.com' },
    });

    // Create 3 high-priority tasks
    for (let i = 0; i < 3; i++) {
      await db.task.create({
        data: {
          userId: user.id,
          title: `High Priority ${i}`,
          priority: 'HIGH',
          status: 'ACTIVE',
        },
      });
    }

    const response = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        title: 'Fourth High Priority',
        priority: 'HIGH',
      }),
    });

    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.error).toContain('3 active high-priority tasks');
  });

  test('should complete a task via PUT /api/tasks/:id/complete', async () => {
    const user = await db.user.create({
      data: { name: 'Completer', email: 'completer@example.com' },
    });

    const task = await db.task.create({
      data: {
        userId: user.id,
        title: 'Task to Complete',
        priority: 'LOW',
        status: 'ACTIVE',
      },
    });

    const response = await fetch(`${BASE_URL}/api/tasks/${task.id}/complete`, {
      method: 'PUT',
    });

    expect(response.status).toBe(200);
    const completedTask = await response.json();
    expect(completedTask.status).toBe('COMPLETED');
    expect(completedTask.completedAt).toBeDefined();
  });

  test('should assign a task via PUT /api/tasks/:id/assign', async () => {
    const user1 = await db.user.create({
      data: { name: 'User 1', email: 'user1@example.com' },
    });
    const user2 = await db.user.create({
      data: { name: 'User 2', email: 'user2@example.com' },
    });

    const task = await db.task.create({
      data: {
        userId: user1.id,
        title: 'Task to Reassign',
        priority: 'MEDIUM',
        status: 'ACTIVE',
      },
    });

    const response = await fetch(`${BASE_URL}/api/tasks/${task.id}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user2.id }),
    });

    expect(response.status).toBe(200);
    const assignedTask = await response.json();
    expect(assignedTask.userId).toBe(user2.id);
  });

  test('should get statistics via GET /api/stats', async () => {
    await clearDatabase();

    await db.user.create({
      data: {
        name: 'Stats User',
        email: 'stats@example.com',
        tasks: {
          create: [
            { title: 'Active 1', priority: 'LOW', status: 'ACTIVE' },
            { title: 'Active 2', priority: 'LOW', status: 'ACTIVE' },
            { title: 'Completed', priority: 'LOW', status: 'COMPLETED', completedAt: new Date() },
          ],
        },
      },
    });

    const response = await fetch(`${BASE_URL}/api/stats`);
    expect(response.status).toBe(200);

    const stats = await response.json();
    expect(stats.totalTasks).toBe(3);
    expect(stats.activeTasks).toBe(2);
    expect(stats.completedTasks).toBe(1);
    expect(stats.totalUsers).toBe(1);
  });
});

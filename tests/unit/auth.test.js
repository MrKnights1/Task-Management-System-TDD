import { describe, test, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { getTestDb, clearDatabase, closeDatabase } from '../helpers/testDatabase.js';
import { startServer } from '../../src/server.js';

const BASE_URL = 'http://localhost:3001';
let server;
let prisma;

beforeEach(async () => {
  prisma = getTestDb();
  await clearDatabase(prisma);
  server = await startServer(3001, prisma);
});

afterEach(() => {
  if (server) {
    server.stop();
  }
});

afterAll(async () => {
  await closeDatabase(prisma);
});

describe('User Authentication', () => {
  test('POST /api/auth/login should authenticate user by email', async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: { name: 'John Doe', email: 'john@example.com' },
    });

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user.id).toBe(user.id);
    expect(data.user.email).toBe('john@example.com');
    expect(data.sessionToken).toBeDefined();
    expect(typeof data.sessionToken).toBe('string');
  });

  test('POST /api/auth/login should return 404 for non-existent user', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('User not found');
  });

  test('GET /api/auth/me should return current user with valid session', async () => {
    // Create user and login
    await prisma.user.create({
      data: { name: 'Jane Doe', email: 'jane@example.com' },
    });

    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jane@example.com' }),
    });
    const { sessionToken } = await loginResponse.json();

    // Get current user
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.email).toBe('jane@example.com');
    expect(data.name).toBe('Jane Doe');
  });

  test('GET /api/auth/me should return 401 without session token', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/me`);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });
});

describe('Authenticated API Endpoints', () => {
  test('GET /api/tasks should only return tasks for logged-in user', async () => {
    // Create two users with tasks
    const user1 = await prisma.user.create({
      data: { name: 'User One', email: 'user1@example.com' },
    });
    const user2 = await prisma.user.create({
      data: { name: 'User Two', email: 'user2@example.com' },
    });

    await prisma.task.create({
      data: { title: 'User1 Task', userId: user1.id, priority: 'HIGH' },
    });
    await prisma.task.create({
      data: { title: 'User2 Task', userId: user2.id, priority: 'MEDIUM' },
    });

    // Login as user1
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user1@example.com' }),
    });
    const { sessionToken } = await loginResponse.json();

    // Get tasks
    const response = await fetch(`${BASE_URL}/api/tasks`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` },
    });

    expect(response.status).toBe(200);
    const tasks = await response.json();
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('User1 Task');
    expect(tasks[0].userId).toBe(user1.id);
  });

  test('POST /api/tasks should create task for logged-in user', async () => {
    const user = await prisma.user.create({
      data: { name: 'Test User', email: 'test@example.com' },
    });

    // Login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    const { sessionToken } = await loginResponse.json();

    // Create task without specifying userId
    const response = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        title: 'My Task',
        priority: 'HIGH',
      }),
    });

    expect(response.status).toBe(200);
    const task = await response.json();
    expect(task.userId).toBe(user.id);
    expect(task.title).toBe('My Task');
  });

  test('PUT /api/tasks/:id/complete should only work for own tasks', async () => {
    const user1 = await prisma.user.create({
      data: { name: 'User One', email: 'user1@example.com' },
    });
    const user2 = await prisma.user.create({
      data: { name: 'User Two', email: 'user2@example.com' },
    });

    const task = await prisma.task.create({
      data: { title: 'User2 Task', userId: user2.id, priority: 'HIGH' },
    });

    // Login as user1
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user1@example.com' }),
    });
    const { sessionToken } = await loginResponse.json();

    // Try to complete user2's task
    const response = await fetch(`${BASE_URL}/api/tasks/${task.id}/complete`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${sessionToken}` },
    });

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  test('API endpoints should return 401 without authentication', async () => {
    const response = await fetch(`${BASE_URL}/api/tasks`);
    expect(response.status).toBe(401);
  });
});

import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import { getTestDb, clearDatabase, closeDatabase } from '../helpers/testDatabase.js';
import { TaskService } from '../../src/services/TaskService.js';

describe('Feature 1: Create Task with Priority Validation', () => {
  let db;
  let taskService;
  let testUser;

  beforeEach(async () => {
    db = getTestDb();
    await clearDatabase();
    taskService = new TaskService(db);

    // Create a test user
    testUser = await db.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('should create high-priority task when user has 0 active high-priority tasks', async () => {
    const task = await taskService.createTask({
      userId: testUser.id,
      title: 'First high priority task',
      description: 'This should be allowed',
      priority: 'HIGH',
    });

    expect(task).toBeDefined();
    expect(task.priority).toBe('HIGH');
    expect(task.status).toBe('ACTIVE');
  });

  test('should create high-priority task when user has 2 active high-priority tasks', async () => {
    // Create 2 existing high-priority tasks
    await db.task.create({
      data: {
        userId: testUser.id,
        title: 'High priority task 1',
        priority: 'HIGH',
        status: 'ACTIVE',
      },
    });
    await db.task.create({
      data: {
        userId: testUser.id,
        title: 'High priority task 2',
        priority: 'HIGH',
        status: 'ACTIVE',
      },
    });

    const task = await taskService.createTask({
      userId: testUser.id,
      title: 'Third high priority task',
      description: 'This should be allowed',
      priority: 'HIGH',
    });

    expect(task).toBeDefined();
    expect(task.priority).toBe('HIGH');
  });

  test('should reject high-priority task when user has 3 active high-priority tasks', async () => {
    // Create 3 existing high-priority tasks
    await db.task.create({
      data: {
        userId: testUser.id,
        title: 'High priority task 1',
        priority: 'HIGH',
        status: 'ACTIVE',
      },
    });
    await db.task.create({
      data: {
        userId: testUser.id,
        title: 'High priority task 2',
        priority: 'HIGH',
        status: 'ACTIVE',
      },
    });
    await db.task.create({
      data: {
        userId: testUser.id,
        title: 'High priority task 3',
        priority: 'HIGH',
        status: 'ACTIVE',
      },
    });

    await expect(
      taskService.createTask({
        userId: testUser.id,
        title: 'Fourth high priority task',
        description: 'This should be rejected',
        priority: 'HIGH',
      })
    ).rejects.toThrow('User already has 3 active high-priority tasks');
  });

  test('should allow creating medium/low priority tasks regardless of count', async () => {
    // Create 3 high-priority tasks to reach the limit
    await db.task.create({
      data: {
        userId: testUser.id,
        title: 'High priority task 1',
        priority: 'HIGH',
        status: 'ACTIVE',
      },
    });
    await db.task.create({
      data: {
        userId: testUser.id,
        title: 'High priority task 2',
        priority: 'HIGH',
        status: 'ACTIVE',
      },
    });
    await db.task.create({
      data: {
        userId: testUser.id,
        title: 'High priority task 3',
        priority: 'HIGH',
        status: 'ACTIVE',
      },
    });

    // Should still allow MEDIUM and LOW priority tasks
    const mediumTask = await taskService.createTask({
      userId: testUser.id,
      title: 'Medium priority task',
      priority: 'MEDIUM',
    });

    const lowTask = await taskService.createTask({
      userId: testUser.id,
      title: 'Low priority task',
      priority: 'LOW',
    });

    expect(mediumTask).toBeDefined();
    expect(mediumTask.priority).toBe('MEDIUM');
    expect(lowTask).toBeDefined();
    expect(lowTask.priority).toBe('LOW');
  });
});

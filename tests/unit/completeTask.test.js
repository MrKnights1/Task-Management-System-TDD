import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import { getTestDb, clearDatabase, closeDatabase } from '../helpers/testDatabase.js';
import { TaskService } from '../../src/services/TaskService.js';
import { Clock } from '../../src/utils/clock.js';

describe('Feature 2: Complete Task with Time Tracking', () => {
  let db;
  let taskService;
  let testUser;
  let mockClock;
  const fixedDate = new Date('2024-01-15T10:00:00Z');

  beforeEach(async () => {
    db = getTestDb();
    await clearDatabase();

    // Mock clock
    mockClock = new Clock();
    mockClock.now = () => fixedDate;

    taskService = new TaskService(db, mockClock);

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

  test('should complete active task and set completedAt timestamp', async () => {
    // Create an active task
    const task = await db.task.create({
      data: {
        userId: testUser.id,
        title: 'Task to complete',
        priority: 'MEDIUM',
        status: 'ACTIVE',
      },
    });

    const completedTask = await taskService.completeTask(task.id);

    expect(completedTask.status).toBe('COMPLETED');
    expect(completedTask.completedAt).toEqual(fixedDate);
  });

  test('should reject completing already completed task', async () => {
    // Create a completed task
    const task = await db.task.create({
      data: {
        userId: testUser.id,
        title: 'Already completed task',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        completedAt: new Date('2024-01-14T10:00:00Z'),
      },
    });

    await expect(taskService.completeTask(task.id)).rejects.toThrow(
      'Task is already completed'
    );
  });

  test('should reject completing cancelled task', async () => {
    // Create a cancelled task
    const task = await db.task.create({
      data: {
        userId: testUser.id,
        title: 'Cancelled task',
        priority: 'MEDIUM',
        status: 'CANCELLED',
      },
    });

    await expect(taskService.completeTask(task.id)).rejects.toThrow(
      'Cannot complete a cancelled task'
    );
  });

  test('should change status from ACTIVE to COMPLETED', async () => {
    // Create an active task
    const task = await db.task.create({
      data: {
        userId: testUser.id,
        title: 'Task to check status change',
        priority: 'LOW',
        status: 'ACTIVE',
      },
    });

    expect(task.status).toBe('ACTIVE');
    expect(task.completedAt).toBeNull();

    const completedTask = await taskService.completeTask(task.id);

    expect(completedTask.status).toBe('COMPLETED');
    expect(completedTask.completedAt).toBeDefined();
    expect(completedTask.completedAt).toEqual(fixedDate);
  });
});

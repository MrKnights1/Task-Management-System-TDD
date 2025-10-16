import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import { getTestDb, clearDatabase, closeDatabase } from '../helpers/testDatabase.js';
import { TaskService } from '../../src/services/TaskService.js';

describe('Feature 3: Assign Task with Availability Check', () => {
  let db;
  let taskService;
  let user1;
  let user2;

  beforeEach(async () => {
    db = getTestDb();
    await clearDatabase();
    taskService = new TaskService(db);

    // Create test users
    user1 = await db.user.create({
      data: {
        email: 'user1@example.com',
        name: 'User One',
      },
    });

    user2 = await db.user.create({
      data: {
        email: 'user2@example.com',
        name: 'User Two',
      },
    });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('should assign task when user has 0 active tasks', async () => {
    // Create an unassigned task
    const task = await db.task.create({
      data: {
        userId: user1.id,
        title: 'Task to assign',
        priority: 'MEDIUM',
        status: 'ACTIVE',
      },
    });

    const assignedTask = await taskService.assignTask(task.id, user2.id);

    expect(assignedTask.userId).toBe(user2.id);
  });

  test('should assign task when user has 9 active tasks', async () => {
    // Create 9 active tasks for user2
    for (let i = 0; i < 9; i++) {
      await db.task.create({
        data: {
          userId: user2.id,
          title: `Task ${i + 1}`,
          priority: 'MEDIUM',
          status: 'ACTIVE',
        },
      });
    }

    // Create a task assigned to user1
    const task = await db.task.create({
      data: {
        userId: user1.id,
        title: 'Task to reassign',
        priority: 'LOW',
        status: 'ACTIVE',
      },
    });

    const assignedTask = await taskService.assignTask(task.id, user2.id);

    expect(assignedTask.userId).toBe(user2.id);
  });

  test('should reject assignment when user has 10 active tasks', async () => {
    // Create 10 active tasks for user2
    for (let i = 0; i < 10; i++) {
      await db.task.create({
        data: {
          userId: user2.id,
          title: `Task ${i + 1}`,
          priority: 'MEDIUM',
          status: 'ACTIVE',
        },
      });
    }

    // Create a task assigned to user1
    const task = await db.task.create({
      data: {
        userId: user1.id,
        title: 'Task to reassign',
        priority: 'LOW',
        status: 'ACTIVE',
      },
    });

    await expect(taskService.assignTask(task.id, user2.id)).rejects.toThrow(
      'User already has 10 active tasks'
    );
  });

  test('should allow reassignment from one user to another if target is available', async () => {
    // user1 has 10 tasks, user2 has 5 tasks
    for (let i = 0; i < 10; i++) {
      await db.task.create({
        data: {
          userId: user1.id,
          title: `User1 Task ${i + 1}`,
          priority: 'MEDIUM',
          status: 'ACTIVE',
        },
      });
    }

    for (let i = 0; i < 5; i++) {
      await db.task.create({
        data: {
          userId: user2.id,
          title: `User2 Task ${i + 1}`,
          priority: 'MEDIUM',
          status: 'ACTIVE',
        },
      });
    }

    // Create a task assigned to user1
    const task = await db.task.create({
      data: {
        userId: user1.id,
        title: 'Task to reassign from user1 to user2',
        priority: 'HIGH',
        status: 'ACTIVE',
      },
    });

    // Should allow reassignment to user2 since user2 has only 5 active tasks
    const assignedTask = await taskService.assignTask(task.id, user2.id);

    expect(assignedTask.userId).toBe(user2.id);

    // Verify user1 now has 10 tasks and user2 has 6
    const user1Tasks = await db.task.count({
      where: { userId: user1.id, status: 'ACTIVE' },
    });
    const user2Tasks = await db.task.count({
      where: { userId: user2.id, status: 'ACTIVE' },
    });

    expect(user1Tasks).toBe(10);
    expect(user2Tasks).toBe(6);
  });
});

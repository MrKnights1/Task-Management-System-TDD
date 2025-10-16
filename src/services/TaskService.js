export class TaskService {
  constructor(db, clock = null) {
    this.db = db;
    this.clock = clock || { now: () => new Date() };
  }

  async createTask({ userId, title, description, priority }) {
    await this._validatePriorityLimit(userId, priority);

    const task = await this.db.task.create({
      data: {
        userId,
        title,
        description,
        priority,
      },
    });

    return task;
  }

  async completeTask(taskId) {
    const task = await this.db.task.findUnique({
      where: { id: taskId },
    });

    this._validateTaskCanBeCompleted(task);

    const completedTask = await this.db.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: this.clock.now(),
      },
    });

    return completedTask;
  }

  async assignTask(taskId, newUserId) {
    // Check if target user has capacity
    const activeTaskCount = await this.db.task.count({
      where: {
        userId: newUserId,
        status: 'ACTIVE',
      },
    });

    if (activeTaskCount >= 10) {
      throw new Error('User already has 10 active tasks');
    }

    // Assign the task
    const assignedTask = await this.db.task.update({
      where: { id: taskId },
      data: {
        userId: newUserId,
      },
    });

    return assignedTask;
  }

  _validateTaskCanBeCompleted(task) {
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status === 'COMPLETED') {
      throw new Error('Task is already completed');
    }

    if (task.status === 'CANCELLED') {
      throw new Error('Cannot complete a cancelled task');
    }
  }

  async _validatePriorityLimit(userId, priority) {
    if (priority !== 'HIGH') {
      return;
    }

    const activeHighPriorityCount = await this.db.task.count({
      where: {
        userId: userId,
        priority: 'HIGH',
        status: 'ACTIVE',
      },
    });

    if (activeHighPriorityCount >= 3) {
      throw new Error('User already has 3 active high-priority tasks');
    }
  }
}

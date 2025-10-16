export class TaskService {
  constructor(db) {
    this.db = db;
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

// Route handlers extracted for better organization

export function createRoutes(prisma, taskService) {
  return {
    async handleGetUsers() {
      const users = await prisma.user.findMany({
        include: {
          tasks: { where: { status: 'ACTIVE' } },
        },
      });
      return Response.json(users);
    },

    async handleCreateUser(req) {
      const body = await req.json();
      const user = await prisma.user.create({
        data: { email: body.email, name: body.name },
      });
      return Response.json(user);
    },

    async handleGetTasks() {
      const tasks = await prisma.task.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
      return Response.json(tasks);
    },

    async handleCreateTask(req) {
      try {
        const body = await req.json();
        const task = await taskService.createTask(body);
        return Response.json(task);
      } catch (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
    },

    async handleCompleteTask(taskId) {
      try {
        const task = await taskService.completeTask(taskId);
        return Response.json(task);
      } catch (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
    },

    async handleAssignTask(taskId, req) {
      try {
        const body = await req.json();
        const task = await taskService.assignTask(taskId, body.userId);
        return Response.json(task);
      } catch (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
    },

    async handleGetStats() {
      const [totalTasks, activeTasks, completedTasks, totalUsers] = await Promise.all([
        prisma.task.count(),
        prisma.task.count({ where: { status: 'ACTIVE' } }),
        prisma.task.count({ where: { status: 'COMPLETED' } }),
        prisma.user.count(),
      ]);

      return Response.json({ totalTasks, activeTasks, completedTasks, totalUsers });
    },
  };
}

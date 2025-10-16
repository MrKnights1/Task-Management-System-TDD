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

    async handleGetTasks(currentUser) {
      const tasks = await prisma.task.findMany({
        where: { userId: currentUser.id },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
      return Response.json(tasks);
    },

    async handleCreateTask(req, currentUser) {
      try {
        const body = await req.json();
        const task = await taskService.createTask({
          ...body,
          userId: currentUser.id,
        });
        return Response.json(task);
      } catch (error) {
        return Response.json({ error: error.message }, { status: 400 });
      }
    },

    async handleCompleteTask(taskId, currentUser) {
      try {
        // Check if task belongs to current user
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task || task.userId !== currentUser.id) {
          return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
        const completedTask = await taskService.completeTask(taskId);
        return Response.json(completedTask);
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

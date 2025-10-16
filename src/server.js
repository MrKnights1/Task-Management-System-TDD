import { TaskService } from './services/TaskService.js';

export async function startServer(port, prisma) {
  const taskService = new TaskService(prisma);

  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // GET /api/users
      if (url.pathname === '/api/users' && req.method === 'GET') {
        const users = await prisma.user.findMany({
          include: {
            tasks: {
              where: { status: 'ACTIVE' },
            },
          },
        });
        return Response.json(users);
      }

      // POST /api/users
      if (url.pathname === '/api/users' && req.method === 'POST') {
        const body = await req.json();
        const user = await prisma.user.create({
          data: {
            email: body.email,
            name: body.name,
          },
        });
        return Response.json(user);
      }

      // GET /api/tasks
      if (url.pathname === '/api/tasks' && req.method === 'GET') {
        const tasks = await prisma.task.findMany({
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        });
        return Response.json(tasks);
      }

      // POST /api/tasks
      if (url.pathname === '/api/tasks' && req.method === 'POST') {
        try {
          const body = await req.json();
          const task = await taskService.createTask({
            userId: body.userId,
            title: body.title,
            description: body.description,
            priority: body.priority,
          });
          return Response.json(task);
        } catch (error) {
          return Response.json({ error: error.message }, { status: 400 });
        }
      }

      // PUT /api/tasks/:id/complete
      if (url.pathname.match(/^\/api\/tasks\/\d+\/complete$/) && req.method === 'PUT') {
        try {
          const taskId = parseInt(url.pathname.split('/')[3]);
          const task = await taskService.completeTask(taskId);
          return Response.json(task);
        } catch (error) {
          return Response.json({ error: error.message }, { status: 400 });
        }
      }

      // PUT /api/tasks/:id/assign
      if (url.pathname.match(/^\/api\/tasks\/\d+\/assign$/) && req.method === 'PUT') {
        try {
          const taskId = parseInt(url.pathname.split('/')[3]);
          const body = await req.json();
          const task = await taskService.assignTask(taskId, body.userId);
          return Response.json(task);
        } catch (error) {
          return Response.json({ error: error.message }, { status: 400 });
        }
      }

      // GET /api/stats
      if (url.pathname === '/api/stats' && req.method === 'GET') {
        const totalTasks = await prisma.task.count();
        const activeTasks = await prisma.task.count({ where: { status: 'ACTIVE' } });
        const completedTasks = await prisma.task.count({ where: { status: 'COMPLETED' } });
        const totalUsers = await prisma.user.count();

        return Response.json({
          totalTasks,
          activeTasks,
          completedTasks,
          totalUsers,
        });
      }

      return new Response('Not Found', { status: 404 });
    },
  });

  return server;
}

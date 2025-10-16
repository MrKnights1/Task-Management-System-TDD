import { TaskService } from './services/TaskService.js';
import { createRoutes } from './routes.js';

export async function startServer(port, prisma) {
  const taskService = new TaskService(prisma);
  const routes = createRoutes(prisma, taskService);

  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // API Routes
      if (url.pathname === '/api/users' && req.method === 'GET') {
        return routes.handleGetUsers();
      }

      if (url.pathname === '/api/users' && req.method === 'POST') {
        return routes.handleCreateUser(req);
      }

      if (url.pathname === '/api/tasks' && req.method === 'GET') {
        return routes.handleGetTasks();
      }

      if (url.pathname === '/api/tasks' && req.method === 'POST') {
        return routes.handleCreateTask(req);
      }

      if (url.pathname.match(/^\/api\/tasks\/\d+\/complete$/) && req.method === 'PUT') {
        const taskId = parseInt(url.pathname.split('/')[3]);
        return routes.handleCompleteTask(taskId);
      }

      if (url.pathname.match(/^\/api\/tasks\/\d+\/assign$/) && req.method === 'PUT') {
        const taskId = parseInt(url.pathname.split('/')[3]);
        return routes.handleAssignTask(taskId, req);
      }

      if (url.pathname === '/api/stats' && req.method === 'GET') {
        return routes.handleGetStats();
      }

      return new Response('Not Found', { status: 404 });
    },
  });

  return server;
}

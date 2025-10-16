import { TaskService } from './services/TaskService.js';
import { AuthService } from './services/AuthService.js';
import { createRoutes } from './routes.js';

export async function startServer(port, prisma) {
  const taskService = new TaskService(prisma);
  const authService = new AuthService(prisma);
  const routes = createRoutes(prisma, taskService);

  const server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // Serve static files
      if (url.pathname === '/') {
        return new Response(Bun.file('./public/index.html'));
      }
      if (url.pathname.startsWith('/css/')) {
        return new Response(Bun.file(`./public${url.pathname}`));
      }
      if (url.pathname.startsWith('/js/')) {
        return new Response(Bun.file(`./public${url.pathname}`));
      }

      // Auth routes (public)
      if (url.pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await req.json();
        const result = await authService.login(body.email);
        if (!result) {
          return Response.json({ error: 'User not found' }, { status: 404 });
        }
        return Response.json(result);
      }

      if (url.pathname === '/api/auth/me' && req.method === 'GET') {
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        const user = await authService.authenticate(token);
        if (!user) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return Response.json(user);
      }

      // Public routes
      if (url.pathname === '/api/users' && req.method === 'POST') {
        return routes.handleCreateUser(req);
      }

      // Protected routes - require authentication
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      const currentUser = await authService.authenticate(token);
      if (!currentUser) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (url.pathname === '/api/users' && req.method === 'GET') {
        return routes.handleGetUsers();
      }

      if (url.pathname === '/api/tasks' && req.method === 'GET') {
        return routes.handleGetTasks(currentUser);
      }

      if (url.pathname === '/api/tasks' && req.method === 'POST') {
        return routes.handleCreateTask(req, currentUser);
      }

      if (url.pathname.match(/^\/api\/tasks\/\d+\/complete$/) && req.method === 'PUT') {
        const taskId = parseInt(url.pathname.split('/')[3]);
        return routes.handleCompleteTask(taskId, currentUser);
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

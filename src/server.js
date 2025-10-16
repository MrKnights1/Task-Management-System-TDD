import { TaskService } from './services/TaskService.js';
import { createRoutes } from './routes.js';

// In-memory session store (simple implementation for GREEN phase)
const sessions = new Map();

function generateSessionToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function authenticate(req, prisma) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const userId = sessions.get(token);
  if (!userId) {
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

export async function startServer(port, prisma) {
  const taskService = new TaskService(prisma);
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
        const user = await prisma.user.findUnique({ where: { email: body.email } });
        if (!user) {
          return Response.json({ error: 'User not found' }, { status: 404 });
        }
        const sessionToken = generateSessionToken();
        sessions.set(sessionToken, user.id);
        return Response.json({ user, sessionToken });
      }

      if (url.pathname === '/api/auth/me' && req.method === 'GET') {
        const user = await authenticate(req, prisma);
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
      const currentUser = await authenticate(req, prisma);
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

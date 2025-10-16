import { PrismaClient } from '@prisma/client';
import { startServer } from './src/server.js';

const prisma = new PrismaClient();
const server = await startServer(3000, prisma);
console.log(`🚀 Server running at http://localhost:${server.port}`);

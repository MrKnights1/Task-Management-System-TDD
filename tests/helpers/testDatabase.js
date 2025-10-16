import { PrismaClient } from '@prisma/client';

let prisma;

export function getTestDb() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function clearDatabase() {
  const db = getTestDb();
  await db.task.deleteMany();
  await db.user.deleteMany();
}

export async function closeDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

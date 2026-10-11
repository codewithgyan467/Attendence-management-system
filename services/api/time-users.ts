import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting...');
  await prisma.$connect();
  console.log('Connected. Running warm-up query...');
  await prisma.user.findFirst();
  console.log('Running actual query...');
  console.time('fetchUsers');
  const users = await prisma.user.findMany({ include: { studentProfile: true, facultyProfile: true } });
  console.timeEnd('fetchUsers');
  console.log('Total users:', users.length);
}
main().finally(() => prisma.$disconnect());

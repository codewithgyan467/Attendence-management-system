import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('MinorProject2026', 10);
  await prisma.user.upsert({
    where: { email: 'admin@aec.ac.in' },
    update: { password: hashedPassword, role: 'ADMIN' },
    create: {
      email: 'admin@aec.ac.in',
      firstName: 'System',
      lastName: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    }
  });
  console.log('Admin user updated/created successfully with MinorProject2026');
}

main().catch(console.error).finally(() => prisma.$disconnect());

import pkg from '@prisma/client';
import * as bcrypt from 'bcrypt';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  
  let adminUser = await prisma.user.findUnique({ where: { email: 'admin@aec.ac.in' } });
  
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@aec.ac.in',
        firstName: 'System',
        lastName: 'Admin',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log('Admin user created successfully.');
  } else {
    console.log('Admin user already exists.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

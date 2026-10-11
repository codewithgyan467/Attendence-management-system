import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findUnique({where: {email: 'abhinash.sarmah@aec.ac.in'}});
  if (!u) {
    console.log('Student not found');
    return;
  }
  console.log('User found:', u.email, 'Role:', u.role);
  const match = await bcrypt.compare('Student@123', u.password);
  console.log('Password match?', match);
}
main().finally(() => prisma.$disconnect());

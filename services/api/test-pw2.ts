import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findUnique({where: {email: 'abhinash.sarmah@aec.ac.in'}});
  if (!u) return;
  const match1 = await bcrypt.compare('Student@123', u.password);
  const match2 = await bcrypt.compare('student@123', u.password);
  console.log('Student@123 match:', match1);
  console.log('student@123 match:', match2);
}
main().finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 
async function main() { 
  const u = await prisma.user.findUnique({where: {email: 'jyotiprakash.ca@aec.ac.in'}}); 
  console.log(u); 
} 
main();

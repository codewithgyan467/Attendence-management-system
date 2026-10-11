import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('Starting an active session for testing...');
  
  // Find Faculty
  const faculty = await prisma.user.findFirst({ where: { email: 'gunajit.cse@aec.ac.in' }, include: { facultyProfile: true } });
  if (!faculty || !faculty.facultyProfile) throw new Error('Faculty not found');

  // Find Classroom
  const classroom = await prisma.classroom.findFirst({ where: { name: 'CSE Lecture Hall 1' } });
  if (!classroom) throw new Error('Classroom not found');

  // Start Session
  const session = await prisma.classSession.create({
    data: {
      facultyProfileId: faculty.facultyProfile.id,
      classroomId: classroom.id,
      status: 'ACTIVE',
      startTime: new Date()
    }
  });

  console.log('Active session created:', session.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());

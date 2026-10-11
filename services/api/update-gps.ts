import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('Updating Classroom GPS Coordinates to strictly enforce 30-meter radius...');
  
  // Find the Master of Computer Applications department
  const mcaDept = await prisma.department.findFirst({ where: { name: 'Master of Computer Applications' } });
  
  if (mcaDept) {
    // We update all classrooms or specifically create/update the MCA classrooms
    // Earlier we used 'CSE Lecture Hall 1', let's just update all classrooms for testing
    await prisma.classroom.updateMany({
      data: {
        latitude: 26.142845,
        longitude: 91.660126,
        allowedRadiusMeters: 30, // Strictly 30 meters
        maxGpsAccuracy: 50 // Allowing standard mobile GPS accuracy but distance must be <30m
      }
    });
    console.log('Classroom GPS updated to 26.142845, 91.660126 with 30m radius.');
  }

  console.log('GPS Update complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

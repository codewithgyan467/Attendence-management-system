import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MCA 3rd Semester Timetable Entries...');

  const term3rd = await prisma.academicTerm.findFirst({ where: { name: '3rd Semester' } });
  if (!term3rd) {
    throw new Error('3rd Semester term not found.');
  }

  const classroom = await prisma.classroom.findFirst();
  if (!classroom) throw new Error('Classroom not found.');
  
  const mcaDept = await prisma.department.findFirst({ where: { name: 'Master of Computer Applications' } });

  // Add specific 3rd-semester subjects from the timetable if they don't exist
  const subjects = [
    { code: 'MCA-MINI', name: 'Mini Project/Seminar' },
    { code: 'MCA-IDS', name: 'IDS' },
    { code: 'MCA-WTS', name: 'WTS' },
    { code: 'MCA-AIML', name: 'AIML' },
    { code: 'MCA-E2', name: 'Elective II' },
    { code: 'MCA-E3', name: 'Elective III' },
  ];

  for (const sub of subjects) {
    const subject = await prisma.subject.upsert({
      where: { code: sub.code },
      update: {},
      create: { name: sub.name, code: sub.code, departmentId: mcaDept!.id }
    });
    // Ensure Section A exists
    await prisma.section.findFirst({ where: { subjectId: subject.id, name: 'A' } })
      || await prisma.section.create({ data: { name: 'A', subjectId: subject.id } });
  }

  // Fetch Sections
  const getSection = async (code: string) => {
    const sub = await prisma.subject.findFirst({ where: { code } });
    return prisma.section.findFirst({ where: { subjectId: sub!.id, name: 'A' } });
  };

  const miniSec = await getSection('MCA-MINI');
  const idsSec = await getSection('MCA-IDS');
  const wtsSec = await getSection('MCA-WTS');
  const aimlSec = await getSection('MCA-AIML');
  const e2Sec = await getSection('MCA-E2');
  const e3Sec = await getSection('MCA-E3');

  const entries = [];

  // Monday
  entries.push({ academicTermId: term3rd.id, sectionId: miniSec!.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '08:00', endTime: '10:00', subjectType: 'Lab/Seminar' });
  entries.push({ academicTermId: term3rd.id, sectionId: e2Sec!.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '10:00', endTime: '11:00', subjectType: 'Theory' });
  entries.push({ academicTermId: term3rd.id, sectionId: idsSec!.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' });
  entries.push({ academicTermId: term3rd.id, sectionId: wtsSec!.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' });

  // Tuesday
  entries.push({ academicTermId: term3rd.id, sectionId: miniSec!.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '08:00', endTime: '10:00', subjectType: 'Lab/Seminar' });
  entries.push({ academicTermId: term3rd.id, sectionId: e3Sec!.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '10:00', endTime: '11:00', subjectType: 'Theory' });
  entries.push({ academicTermId: term3rd.id, sectionId: aimlSec!.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' });
  entries.push({ academicTermId: term3rd.id, sectionId: idsSec!.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' });
  entries.push({ academicTermId: term3rd.id, sectionId: wtsSec!.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '14:00', endTime: '15:00', subjectType: 'Theory' });
  entries.push({ academicTermId: term3rd.id, sectionId: e2Sec!.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '15:00', endTime: '16:00', subjectType: 'Theory' });

  // Wednesday
  entries.push({ academicTermId: term3rd.id, sectionId: miniSec!.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '08:00', endTime: '10:00', subjectType: 'Lab/Seminar' });
  entries.push({ academicTermId: term3rd.id, sectionId: e3Sec!.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '10:00', endTime: '11:00', subjectType: 'Theory' });
  entries.push({ academicTermId: term3rd.id, sectionId: idsSec!.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' });
  entries.push({ academicTermId: term3rd.id, sectionId: e2Sec!.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' });
  entries.push({ academicTermId: term3rd.id, sectionId: aimlSec!.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '14:00', endTime: '15:00', subjectType: 'Tutorial' });
  entries.push({ academicTermId: term3rd.id, sectionId: wtsSec!.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '15:00', endTime: '16:00', subjectType: 'Theory' });

  // Thursday
  entries.push({ academicTermId: term3rd.id, sectionId: miniSec!.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '08:00', endTime: '11:00', subjectType: 'Lab/Seminar' });
  entries.push({ academicTermId: term3rd.id, sectionId: aimlSec!.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' });
  entries.push({ academicTermId: term3rd.id, sectionId: e3Sec!.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' });

  // Friday
  entries.push({ academicTermId: term3rd.id, sectionId: miniSec!.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '08:00', endTime: '10:00', subjectType: 'Lab/Seminar' });
  entries.push({ academicTermId: term3rd.id, sectionId: idsSec!.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '10:00', endTime: '11:00', subjectType: 'Tutorial' });
  entries.push({ academicTermId: term3rd.id, sectionId: wtsSec!.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '11:00', endTime: '12:00', subjectType: 'Tutorial' });
  entries.push({ academicTermId: term3rd.id, sectionId: aimlSec!.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' });

  // Saturday
  entries.push({ academicTermId: term3rd.id, sectionId: miniSec!.id, classroomId: classroom.id, dayOfWeek: 6, startTime: '08:00', endTime: '12:00', subjectType: 'Lab/Seminar' });

  // Insert all
  for (const entry of entries) {
    await prisma.timetableEntry.create({ data: entry });
  }

  console.log(`Successfully seeded ${entries.length} Timetable Entries for MCA 3rd Semester!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

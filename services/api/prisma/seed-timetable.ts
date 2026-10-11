import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MCA Timetable Entries...');

  const term1st = await prisma.academicTerm.findFirst({ where: { name: '1st Semester' } });
  const term3rd = await prisma.academicTerm.findFirst({ where: { name: '3rd Semester' } });
  
  if (!term1st || !term3rd) {
    throw new Error('Academic Terms not found. Please run MCA seed script first.');
  }

  // Find Classroom
  const classroom = await prisma.classroom.findFirst();
  if (!classroom) throw new Error('Classroom not found.');

  // Find Subjects
  const coa = await prisma.subject.findFirst({ where: { code: 'MCA-COA' } });
  const os = await prisma.subject.findFirst({ where: { code: 'MCA-OS' } });
  const daa = await prisma.subject.findFirst({ where: { code: 'MCA-DAA' } });
  const lab = await prisma.subject.findFirst({ where: { code: 'MCA-LAB' } });

  // Helper to fetch section
  const getSection = async (subjectId: string) => {
    return prisma.section.findFirst({ where: { subjectId } });
  };

  const coaSec = coa ? await getSection(coa.id) : null;
  const osSec = os ? await getSection(os.id) : null;
  const daaSec = daa ? await getSection(daa.id) : null;
  const labSec = lab ? await getSection(lab.id) : null;

  const entries = [];

  // Monday
  if (labSec) {
    entries.push({ academicTermId: term1st.id, sectionId: labSec.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '09:00', endTime: '11:00', subjectType: 'Lab' });
  }
  if (daaSec) {
    entries.push({ academicTermId: term1st.id, sectionId: daaSec.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' });
  }
  if (coaSec) {
    entries.push({ academicTermId: term1st.id, sectionId: coaSec.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '14:00', endTime: '15:00', subjectType: 'Theory' });
  }

  // Tuesday
  if (osSec) {
    entries.push({ academicTermId: term1st.id, sectionId: osSec.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '08:00', endTime: '09:00', subjectType: 'Theory' });
  }
  if (labSec) {
    entries.push({ academicTermId: term1st.id, sectionId: labSec.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '09:00', endTime: '11:00', subjectType: 'Lab' });
  }

  // Wednesday
  if (labSec) {
    entries.push({ academicTermId: term1st.id, sectionId: labSec.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '09:00', endTime: '11:00', subjectType: 'Lab' });
  }
  if (coaSec) {
    entries.push({ academicTermId: term1st.id, sectionId: coaSec.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' });
  }
  if (osSec) {
    entries.push({ academicTermId: term1st.id, sectionId: osSec.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '15:00', endTime: '16:00', subjectType: 'Tutorial' });
  }

  // Thursday
  if (osSec) {
    entries.push({ academicTermId: term1st.id, sectionId: osSec.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '08:00', endTime: '09:00', subjectType: 'Theory' });
  }
  if (labSec) {
    entries.push({ academicTermId: term1st.id, sectionId: labSec.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '09:00', endTime: '11:00', subjectType: 'Lab' });
  }
  if (daaSec) {
    entries.push({ academicTermId: term1st.id, sectionId: daaSec.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' });
    entries.push({ academicTermId: term1st.id, sectionId: daaSec.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '14:00', endTime: '15:00', subjectType: 'Tutorial' });
  }

  // Friday
  if (coaSec) {
    entries.push({ academicTermId: term1st.id, sectionId: coaSec.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '10:00', endTime: '11:00', subjectType: 'Theory' });
  }
  if (daaSec) {
    entries.push({ academicTermId: term1st.id, sectionId: daaSec.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' });
  }
  if (osSec) {
    entries.push({ academicTermId: term1st.id, sectionId: osSec.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '14:00', endTime: '15:00', subjectType: 'Theory' });
  }

  // Insert all
  for (const entry of entries) {
    await prisma.timetableEntry.create({ data: entry });
  }

  console.log(`Successfully seeded ${entries.length} Timetable Entries for MCA 1st Semester!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

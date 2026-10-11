import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const facultyList = [
  { name: 'Dr. Subhrajyoti Bordoloi', email: 'sb.mca@aec.ac.in', initial: 'SB', empId: 'FAC-SB-01' },
  { name: 'Dr. Nelson R. Varte', email: 'nv.mca@aec.ac.in', initial: 'NV', empId: 'FAC-NV-02' },
  { name: 'Dr. Maushumi Barooah', email: 'mb.mca@aec.ac.in', initial: 'MB', empId: 'FAC-MB-03' },
  { name: 'Dr. Jyoti Prokash Goswami', email: 'jpg.mca@aec.ac.in', initial: 'JPG', empId: 'FAC-JPG-04' },
  { name: 'Dr. Antara Malakar', email: 'am.mca@aec.ac.in', initial: 'AM', empId: 'FAC-AM-05' },
  { name: 'Dr. Anindita Borah', email: 'ab.mca@aec.ac.in', initial: 'AB', empId: 'FAC-AB-06' },
  { name: 'Faculty ABP', email: 'abp.mca@aec.ac.in', initial: 'ABP', empId: 'FAC-ABP-07' },
  { name: 'Faculty BG', email: 'bg.mca@aec.ac.in', initial: 'BG', empId: 'FAC-BG-08' },
];

const timetableData = [
  // MONDAY SEM 1
  { day: 1, sem: 1, start: '08:00', end: '09:00', subject: 'BC - MFCS', faculty: 'AB', type: 'Bridge Course' },
  { day: 1, sem: 1, start: '09:00', end: '11:00', subject: 'LAB PJ', faculty: 'BG', type: 'Lab' },
  { day: 1, sem: 1, start: '11:00', end: '12:00', subject: 'BC - FCSN', faculty: 'JPG', type: 'Bridge Course' },
  { day: 1, sem: 1, start: '13:00', end: '14:00', subject: 'DAA', faculty: 'ABP', type: 'Theory' },
  { day: 1, sem: 1, start: '14:00', end: '15:00', subject: 'COA', faculty: 'AM', type: 'Theory' },
  { day: 1, sem: 1, start: '15:00', end: '16:00', subject: 'ADS', faculty: 'JPG', type: 'Theory' },
  
  // MONDAY SEM 3
  { day: 1, sem: 3, start: '08:00', end: '10:00', subject: 'Mini Project/Seminar', faculty: 'ABP', type: 'Project' },
  { day: 1, sem: 3, start: '10:00', end: '11:00', subject: 'E II [CD, CNS]', faculty: 'AB', type: 'Theory' },
  { day: 1, sem: 3, start: '11:00', end: '12:00', subject: 'IDS', faculty: 'BG', type: 'Theory' },
  { day: 1, sem: 3, start: '13:00', end: '14:00', subject: 'WTS', faculty: 'NV', type: 'Theory' },
  { day: 1, sem: 3, start: '14:00', end: '16:00', subject: 'NBA Work', faculty: 'SB', type: 'Admin' }, // Assigned SB randomly for work
  
  // TUESDAY SEM 1
  { day: 2, sem: 1, start: '08:00', end: '09:00', subject: 'OS', faculty: 'SB', type: 'Theory' },
  { day: 2, sem: 1, start: '09:00', end: '11:00', subject: 'LAB PJ', faculty: 'AM', type: 'Lab' },
  { day: 2, sem: 1, start: '11:00', end: '12:00', subject: 'PTPJ', faculty: 'BG', type: 'Theory' },
  { day: 2, sem: 1, start: '13:00', end: '14:00', subject: 'BC - IPDSC', faculty: 'ABP', type: 'Bridge Course' },
  { day: 2, sem: 1, start: '14:00', end: '15:00', subject: 'BC - MFCS', faculty: 'AB', type: 'Bridge Course' },
  { day: 2, sem: 1, start: '15:00', end: '16:00', subject: 'PTPJ', faculty: 'BG', type: 'Tutorial' }, // TC

  // TUESDAY SEM 3
  { day: 2, sem: 3, start: '08:00', end: '10:00', subject: 'Mini Project/Seminar', faculty: 'JPG', type: 'Project' },
  { day: 2, sem: 3, start: '10:00', end: '11:00', subject: 'E III [ES]', faculty: 'NV', type: 'Theory' },
  { day: 2, sem: 3, start: '11:00', end: '12:00', subject: 'AIML', faculty: 'MB', type: 'Theory' },
  { day: 2, sem: 3, start: '13:00', end: '14:00', subject: 'IDS', faculty: 'BG', type: 'Theory' },
  { day: 2, sem: 3, start: '14:00', end: '15:00', subject: 'WTS', faculty: 'NV', type: 'Theory' },
  { day: 2, sem: 3, start: '15:00', end: '16:00', subject: 'E II [CD, CNS]', faculty: 'AM', type: 'Theory' },

  // WEDNESDAY SEM 1
  { day: 3, sem: 1, start: '08:00', end: '09:00', subject: 'BC - IPDSC', faculty: 'ABP', type: 'Bridge Course' },
  { day: 3, sem: 1, start: '09:00', end: '11:00', subject: 'LAB PJ', faculty: 'AB', type: 'Lab' },
  { day: 3, sem: 1, start: '11:00', end: '12:00', subject: 'COA', faculty: 'AM', type: 'Theory' },
  { day: 3, sem: 1, start: '13:00', end: '14:00', subject: 'ADS', faculty: 'JPG', type: 'Theory' },
  { day: 3, sem: 1, start: '14:00', end: '15:00', subject: 'BC - FCSN', faculty: 'MB', type: 'Bridge Course' },
  { day: 3, sem: 1, start: '15:00', end: '16:00', subject: 'OS', faculty: 'SB', type: 'Tutorial' }, // TC

  // WEDNESDAY SEM 3
  { day: 3, sem: 3, start: '08:00', end: '10:00', subject: 'Mini Project/Seminar', faculty: 'SB', type: 'Project' },
  { day: 3, sem: 3, start: '10:00', end: '11:00', subject: 'E III [ES]', faculty: 'NV', type: 'Theory' },
  { day: 3, sem: 3, start: '11:00', end: '12:00', subject: 'IDS', faculty: 'BG', type: 'Theory' },
  { day: 3, sem: 3, start: '13:00', end: '14:00', subject: 'E II [CD, CNS]', faculty: 'AM', type: 'Theory' },
  { day: 3, sem: 3, start: '14:00', end: '15:00', subject: 'AIML', faculty: 'AB', type: 'Tutorial' }, // TC
  { day: 3, sem: 3, start: '15:00', end: '16:00', subject: 'WTS', faculty: 'NV', type: 'Theory' },

  // THURSDAY SEM 1
  { day: 4, sem: 1, start: '08:00', end: '09:00', subject: 'OS', faculty: 'SB', type: 'Theory' },
  { day: 4, sem: 1, start: '09:00', end: '11:00', subject: 'LAB PJ', faculty: 'NV', type: 'Lab' },
  { day: 4, sem: 1, start: '11:00', end: '12:00', subject: 'PTPJ', faculty: 'BG', type: 'Theory' },
  { day: 4, sem: 1, start: '13:00', end: '14:00', subject: 'DAA', faculty: 'ABP', type: 'Theory' },
  { day: 4, sem: 1, start: '14:00', end: '15:00', subject: 'DAA', faculty: 'ABP', type: 'Tutorial' }, // TC
  { day: 4, sem: 1, start: '15:00', end: '16:00', subject: 'BC - FCSN', faculty: 'MB', type: 'Bridge Course' },

  // THURSDAY SEM 3
  { day: 4, sem: 3, start: '08:00', end: '11:00', subject: 'Mini Project/Seminar', faculty: 'AB', type: 'Project' },
  { day: 4, sem: 3, start: '11:00', end: '12:00', subject: 'AIML', faculty: 'MB', type: 'Theory' },
  { day: 4, sem: 3, start: '13:00', end: '14:00', subject: 'E III [ES]', faculty: 'NV', type: 'Theory' },
  { day: 4, sem: 3, start: '14:00', end: '16:00', subject: 'NBA Work', faculty: 'SB', type: 'Admin' },

  // FRIDAY SEM 1
  { day: 5, sem: 1, start: '08:00', end: '10:00', subject: 'BC - Lab CDS', faculty: 'SB', type: 'Lab' },
  { day: 5, sem: 1, start: '10:00', end: '11:00', subject: 'COA', faculty: 'AM', type: 'Theory' },
  { day: 5, sem: 1, start: '11:00', end: '12:00', subject: 'DAA', faculty: 'ABP', type: 'Theory' },
  { day: 5, sem: 1, start: '13:00', end: '14:00', subject: 'PTPJ', faculty: 'BG', type: 'Theory' },
  { day: 5, sem: 1, start: '14:00', end: '15:00', subject: 'OS', faculty: 'SB', type: 'Theory' },
  { day: 5, sem: 1, start: '15:00', end: '16:00', subject: 'BC - IPDSC', faculty: 'ABP', type: 'Bridge Course' },

  // FRIDAY SEM 3
  { day: 5, sem: 3, start: '08:00', end: '10:00', subject: 'Mini Project/Seminar', faculty: 'MB', type: 'Project' },
  { day: 5, sem: 3, start: '10:00', end: '11:00', subject: 'IDS', faculty: 'BG', type: 'Tutorial' }, // TC
  { day: 5, sem: 3, start: '11:00', end: '12:00', subject: 'WTS', faculty: 'NV', type: 'Tutorial' }, // TC
  { day: 5, sem: 3, start: '13:00', end: '14:00', subject: 'AIML', faculty: 'MB', type: 'Theory' },
  { day: 5, sem: 3, start: '14:00', end: '16:00', subject: 'NBA Work', faculty: 'SB', type: 'Admin' },

  // SATURDAY SEM 1
  { day: 6, sem: 1, start: '08:00', end: '10:00', subject: 'BC - Lab CDS', faculty: 'AM', type: 'Lab' },
  { day: 6, sem: 1, start: '10:00', end: '11:00', subject: 'BC - MFCS', faculty: 'AB', type: 'Bridge Course' },
  { day: 6, sem: 1, start: '11:00', end: '12:00', subject: 'ADS', faculty: 'JPG', type: 'Theory' },

  // SATURDAY SEM 3
  { day: 6, sem: 3, start: '08:00', end: '12:00', subject: 'Mini Project/Seminar', faculty: 'NV', type: 'Project' },
];

async function main() {
  const hashedPassword = await bcrypt.hash('Faculty@123', 10);
  
  // 1. Get Department
  let dept = await prisma.department.findFirst({ where: { name: 'Computer Applications' } });
  if (!dept) {
    dept = await prisma.department.create({ data: { name: 'Computer Applications', institution: 'Assam Engineering College' } });
  }

  // 2. Create Faculty
  const facultyMap = new Map();
  for (const fac of facultyList) {
    const nameParts = fac.name.split(' ');
    const firstName = nameParts[0] + ' ' + nameParts[1];
    const lastName = nameParts.slice(2).join(' ') || '';

    let user = await prisma.user.findUnique({ where: { email: fac.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: fac.email,
          firstName,
          lastName,
          password: hashedPassword,
          role: 'FACULTY'
        }
      });
    }

    const profile = await prisma.facultyProfile.upsert({
      where: { employeeId: fac.empId },
      update: { userId: user.id, departmentId: dept.id },
      create: { userId: user.id, employeeId: fac.empId, departmentId: dept.id }
    });

    facultyMap.set(fac.initial, profile.id);
  }

  // 3. Create Terms
  const term1 = await prisma.academicTerm.upsert({
    where: { id: 'term-mca-1-2026' },
    update: { isCurrent: true },
    create: { id: 'term-mca-1-2026', year: 2026, name: 'MCA 1st Semester (2026)', startDate: new Date('2026-08-17'), endDate: new Date('2026-12-31'), isCurrent: true }
  }).catch(async () => {
    let t = await prisma.academicTerm.findFirst({ where: { name: 'MCA 1st Semester (2026)' } });
    if (!t) t = await prisma.academicTerm.create({ data: { year: 2026, name: 'MCA 1st Semester (2026)', startDate: new Date('2026-08-17'), endDate: new Date('2026-12-31'), isCurrent: true } });
    return t;
  });

  const term3 = await prisma.academicTerm.upsert({
    where: { id: 'term-mca-3-2026' },
    update: { isCurrent: true },
    create: { id: 'term-mca-3-2026', year: 2026, name: 'MCA 3rd Semester (2026)', startDate: new Date('2026-08-03'), endDate: new Date('2026-12-31'), isCurrent: true }
  }).catch(async () => {
    let t = await prisma.academicTerm.findFirst({ where: { name: 'MCA 3rd Semester (2026)' } });
    if (!t) t = await prisma.academicTerm.create({ data: { year: 2026, name: 'MCA 3rd Semester (2026)', startDate: new Date('2026-08-03'), endDate: new Date('2026-12-31'), isCurrent: true } });
    return t;
  });

  // 4. Classroom
  let classroom = await prisma.classroom.findFirst({ where: { name: 'MCA Room 1' } });
  if (!classroom) {
    classroom = await prisma.classroom.create({
      data: { name: 'MCA Room 1', departmentId: dept.id, building: 'Main Block', floor: '1st Floor' }
    });
  }

  // Clear existing timetable
  await prisma.timetableEntry.deleteMany({});

  // 5. Timetable
  for (const entry of timetableData) {
    const term = entry.sem === 1 ? term1 : term3;
    const facultyId = facultyMap.get(entry.faculty);

    // Find or create subject
    const subjectCode = `TT-${entry.subject.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
    let subject = await prisma.subject.findFirst({ where: { code: subjectCode } });
    if (!subject) {
      subject = await prisma.subject.create({
        data: { name: entry.subject, code: subjectCode, departmentId: dept.id }
      });
    }

    // Find or create Section
    let section = await prisma.section.findFirst({ where: { subjectId: subject.id, name: `Sem ${entry.sem}` } });
    if (!section) {
      section = await prisma.section.create({
        data: { name: `Sem ${entry.sem}`, subjectId: subject.id }
      });
    }

    // Assign faculty to section if not assigned
    if (facultyId) {
      const assignment = await prisma.classAssignment.findFirst({ where: { facultyProfileId: facultyId, sectionId: section.id } });
      if (!assignment) {
        await prisma.classAssignment.create({ data: { facultyProfileId: facultyId, sectionId: section.id } });
      }
    }

    // Create Timetable Entry
    await prisma.timetableEntry.create({
      data: {
        academicTermId: term.id,
        sectionId: section.id,
        classroomId: classroom.id,
        dayOfWeek: entry.day,
        startTime: entry.start,
        endTime: entry.end,
        subjectType: entry.type
      }
    });
  }

  console.log('Seeded Faculty, Terms, and Timetable successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

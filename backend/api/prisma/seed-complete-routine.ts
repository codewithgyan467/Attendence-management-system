import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Complete AEC MCA Timetable from Official Routine...');

  const mcaDept = await prisma.department.findFirst({ where: { name: 'Master of Computer Applications' } })
    || await prisma.department.create({
      data: { name: 'Master of Computer Applications', institution: 'Assam Engineering College' }
    });

  // Terms
  const term1st = await prisma.academicTerm.findFirst({ where: { name: '1st Semester' } })
    || await prisma.academicTerm.create({
      data: { name: '1st Semester', year: 2026, startDate: new Date('2026-08-17'), endDate: new Date('2026-12-20'), isCurrent: true }
    });

  const term3rd = await prisma.academicTerm.findFirst({ where: { name: '3rd Semester' } })
    || await prisma.academicTerm.create({
      data: { name: '3rd Semester', year: 2026, startDate: new Date('2026-08-03'), endDate: new Date('2026-12-20'), isCurrent: true }
    });

  // Classroom
  const classroom = await prisma.classroom.findFirst({ where: { name: 'MCA Computer Lab' } })
    || await prisma.classroom.findFirst()
    || await prisma.classroom.create({
      data: {
        name: 'MCA Lecture Hall 1',
        building: 'MCA Block',
        floor: '1st Floor',
        departmentId: mcaDept.id,
        latitude: 26.1412,
        longitude: 91.6620,
        allowedRadiusMeters: 100,
        maxGpsAccuracy: 50
      }
    });

  // Helper to ensure subject and section exist
  const ensureSubject = async (code: string, name: string) => {
    let subject = await prisma.subject.findFirst({ where: { code } });
    if (!subject) {
      subject = await prisma.subject.create({
        data: { code, name, departmentId: mcaDept.id }
      });
    }
    let section = await prisma.section.findFirst({ where: { subjectId: subject.id, name: 'A' } });
    if (!section) {
      section = await prisma.section.create({
        data: { name: 'A', subjectId: subject.id }
      });
    }
    return section;
  };

  // Subjects for Sem I
  const secMfcs = await ensureSubject('MCA-BC-MFCS', 'Mathematical Foundations of Computer Science');
  const secLabPj = await ensureSubject('MCA-LAB-PJ', 'Programming Lab Project');
  const secFcsn = await ensureSubject('MCA-BC-FCSN', 'Fundamentals of Computer Systems & Networking');
  const secDaa = await ensureSubject('MCA-DAA', 'Design and Analysis of Algorithms');
  const secCoa = await ensureSubject('MCA-COA', 'Computer Organization & Architecture');
  const secAds = await ensureSubject('MCA-ADS', 'Advanced Data Structures');
  const secOs = await ensureSubject('MCA-OS', 'Operating Systems');
  const secPtpj = await ensureSubject('MCA-PTPJ', 'Programming Tools & Project');
  const secIpdsc = await ensureSubject('MCA-BC-IPDSC', 'Intro to Programming & Data Structures');
  const secLabCds = await ensureSubject('MCA-BC-LAB-CDS', 'Bridge Course Lab CDS');

  // Subjects for Sem III
  const secMini = await ensureSubject('MCA-MINI', 'Mini Project / Seminar');
  const secE2 = await ensureSubject('MCA-E2', 'Elective II [CD / CNS]');
  const secE3 = await ensureSubject('MCA-E3', 'Elective III [ES]');
  const secIds = await ensureSubject('MCA-IDS', 'Intrusion Detection Systems');
  const secWts = await ensureSubject('MCA-WTS', 'Web Technologies & Services');
  const secAiml = await ensureSubject('MCA-AIML', 'Artificial Intelligence & Machine Learning');
  const secNba = await ensureSubject('MCA-NBA', 'NBA Departmental Work');

  // Clear previous timetable entries to avoid duplicates
  await prisma.timetableEntry.deleteMany({});
  console.log('Cleared existing timetable entries.');

  const entries: any[] = [
    // ==========================================
    // SEMESTER 1 (I)
    // ==========================================
    // Monday
    { academicTermId: term1st.id, sectionId: secMfcs.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '08:00', endTime: '09:00', subjectType: 'Bridge Course' },
    { academicTermId: term1st.id, sectionId: secLabPj.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '09:00', endTime: '11:00', subjectType: 'Lab' },
    { academicTermId: term1st.id, sectionId: secFcsn.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '11:00', endTime: '12:00', subjectType: 'Bridge Course' },
    { academicTermId: term1st.id, sectionId: secDaa.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secCoa.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '14:00', endTime: '15:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secAds.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '15:00', endTime: '16:00', subjectType: 'Theory' },

    // Tuesday
    { academicTermId: term1st.id, sectionId: secOs.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '08:00', endTime: '09:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secLabPj.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '09:00', endTime: '11:00', subjectType: 'Lab' },
    { academicTermId: term1st.id, sectionId: secPtpj.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secIpdsc.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '13:00', endTime: '14:00', subjectType: 'Bridge Course' },
    { academicTermId: term1st.id, sectionId: secMfcs.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '14:00', endTime: '15:00', subjectType: 'Bridge Course' },
    { academicTermId: term1st.id, sectionId: secPtpj.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '15:00', endTime: '16:00', subjectType: 'Tutorial' },

    // Wednesday
    { academicTermId: term1st.id, sectionId: secIpdsc.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '08:00', endTime: '09:00', subjectType: 'Bridge Course' },
    { academicTermId: term1st.id, sectionId: secLabPj.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '09:00', endTime: '11:00', subjectType: 'Lab' },
    { academicTermId: term1st.id, sectionId: secCoa.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secAds.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secFcsn.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '14:00', endTime: '15:00', subjectType: 'Bridge Course' },
    { academicTermId: term1st.id, sectionId: secOs.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '15:00', endTime: '16:00', subjectType: 'Tutorial' },

    // Thursday
    { academicTermId: term1st.id, sectionId: secOs.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '08:00', endTime: '09:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secLabPj.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '09:00', endTime: '11:00', subjectType: 'Lab' },
    { academicTermId: term1st.id, sectionId: secPtpj.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secDaa.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secDaa.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '14:00', endTime: '15:00', subjectType: 'Tutorial' },
    { academicTermId: term1st.id, sectionId: secFcsn.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '15:00', endTime: '16:00', subjectType: 'Bridge Course' },

    // Friday
    { academicTermId: term1st.id, sectionId: secLabCds.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '08:00', endTime: '10:00', subjectType: 'Bridge Course Lab' },
    { academicTermId: term1st.id, sectionId: secCoa.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '10:00', endTime: '11:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secDaa.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secPtpj.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secOs.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '14:00', endTime: '15:00', subjectType: 'Theory' },
    { academicTermId: term1st.id, sectionId: secIpdsc.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '15:00', endTime: '16:00', subjectType: 'Bridge Course' },

    // Saturday
    { academicTermId: term1st.id, sectionId: secLabCds.id, classroomId: classroom.id, dayOfWeek: 6, startTime: '08:00', endTime: '10:00', subjectType: 'Bridge Course Lab' },
    { academicTermId: term1st.id, sectionId: secMfcs.id, classroomId: classroom.id, dayOfWeek: 6, startTime: '10:00', endTime: '11:00', subjectType: 'Bridge Course' },
    { academicTermId: term1st.id, sectionId: secAds.id, classroomId: classroom.id, dayOfWeek: 6, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' },

    // ==========================================
    // SEMESTER 3 (III)
    // ==========================================
    // Monday
    { academicTermId: term3rd.id, sectionId: secMini.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '08:00', endTime: '10:00', subjectType: 'Seminar' },
    { academicTermId: term3rd.id, sectionId: secE2.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '10:00', endTime: '11:00', subjectType: 'Elective' },
    { academicTermId: term3rd.id, sectionId: secIds.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' },
    { academicTermId: term3rd.id, sectionId: secWts.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' },
    { academicTermId: term3rd.id, sectionId: secNba.id, classroomId: classroom.id, dayOfWeek: 1, startTime: '14:00', endTime: '16:00', subjectType: 'Activity' },

    // Tuesday
    { academicTermId: term3rd.id, sectionId: secMini.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '08:00', endTime: '10:00', subjectType: 'Seminar' },
    { academicTermId: term3rd.id, sectionId: secE3.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '10:00', endTime: '11:00', subjectType: 'Elective' },
    { academicTermId: term3rd.id, sectionId: secAiml.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' },
    { academicTermId: term3rd.id, sectionId: secIds.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' },
    { academicTermId: term3rd.id, sectionId: secWts.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '14:00', endTime: '15:00', subjectType: 'Theory' },
    { academicTermId: term3rd.id, sectionId: secE2.id, classroomId: classroom.id, dayOfWeek: 2, startTime: '15:00', endTime: '16:00', subjectType: 'Elective' },

    // Wednesday
    { academicTermId: term3rd.id, sectionId: secMini.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '08:00', endTime: '10:00', subjectType: 'Seminar' },
    { academicTermId: term3rd.id, sectionId: secE3.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '10:00', endTime: '11:00', subjectType: 'Elective' },
    { academicTermId: term3rd.id, sectionId: secIds.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' },
    { academicTermId: term3rd.id, sectionId: secE2.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '13:00', endTime: '14:00', subjectType: 'Elective' },
    { academicTermId: term3rd.id, sectionId: secAiml.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '14:00', endTime: '15:00', subjectType: 'Tutorial' },
    { academicTermId: term3rd.id, sectionId: secWts.id, classroomId: classroom.id, dayOfWeek: 3, startTime: '15:00', endTime: '16:00', subjectType: 'Theory' },

    // Thursday
    { academicTermId: term3rd.id, sectionId: secMini.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '08:00', endTime: '11:00', subjectType: 'Seminar' },
    { academicTermId: term3rd.id, sectionId: secAiml.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '11:00', endTime: '12:00', subjectType: 'Theory' },
    { academicTermId: term3rd.id, sectionId: secE3.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '13:00', endTime: '14:00', subjectType: 'Elective' },
    { academicTermId: term3rd.id, sectionId: secNba.id, classroomId: classroom.id, dayOfWeek: 4, startTime: '14:00', endTime: '16:00', subjectType: 'Activity' },

    // Friday
    { academicTermId: term3rd.id, sectionId: secMini.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '08:00', endTime: '10:00', subjectType: 'Seminar' },
    { academicTermId: term3rd.id, sectionId: secIds.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '10:00', endTime: '11:00', subjectType: 'Tutorial' },
    { academicTermId: term3rd.id, sectionId: secWts.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '11:00', endTime: '12:00', subjectType: 'Tutorial' },
    { academicTermId: term3rd.id, sectionId: secAiml.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '13:00', endTime: '14:00', subjectType: 'Theory' },
    { academicTermId: term3rd.id, sectionId: secNba.id, classroomId: classroom.id, dayOfWeek: 5, startTime: '14:00', endTime: '16:00', subjectType: 'Activity' },

    // Saturday
    { academicTermId: term3rd.id, sectionId: secMini.id, classroomId: classroom.id, dayOfWeek: 6, startTime: '08:00', endTime: '12:00', subjectType: 'Seminar' },
  ];

  for (const entry of entries) {
    await prisma.timetableEntry.create({ data: entry });
  }

  console.log(`Successfully seeded ${entries.length} Timetable Entries matching Assam Engineering College routine!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

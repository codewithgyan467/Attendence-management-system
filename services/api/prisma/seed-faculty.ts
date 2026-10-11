import pkg from '@prisma/client';
import * as bcrypt from 'bcrypt';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Faculty profiles and mapping assignments...');

  const mcaDept = await prisma.department.findFirst({ where: { name: 'Master of Computer Applications' } });
  if (!mcaDept) throw new Error("MCA Dept not found");

  const faculties = [
    { email: 'jyotiprakash.ca@aec.ac.in', initial: 'JPG', first: 'Jyoti Prokash', last: 'Goswami' },
    { email: 'nelson.varte@aec.ac.in', initial: 'NV', first: 'Nelson R.', last: 'Varte' },
    { email: 'anindita.borah@aec.ac.in', initial: 'AB', first: 'Anindita', last: 'Borah' },
    { email: 'subhrajyoti.bordoloi@aec.ac.in', initial: 'SB', first: 'Subhrajyoti', last: 'Bordoloi' },
    { email: 'maushumi.barooah@aec.ac.in', initial: 'MB', first: 'Maushumi', last: 'Barooah' },
    { email: 'antara.malakar@aec.ac.in', initial: 'AM', first: 'Antara', last: 'Malakar' },
    { email: 'b.g@aec.ac.in', initial: 'BG', first: 'B.', last: 'G.' },
    { email: 'a.b.p@aec.ac.in', initial: 'ABP', first: 'A.B.', last: 'P.' }
  ];

  const hashedPassword = await bcrypt.hash('Faculty@123', 10);

  const facultyProfiles: Record<string, any> = {};

  for (const f of faculties) {
    let user = await prisma.user.findUnique({ where: { email: f.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: f.email,
          firstName: f.first,
          lastName: f.last,
          password: hashedPassword,
          role: 'FACULTY',
          facultyProfile: {
            create: {
              employeeId: `EMP-${f.initial}`,
              departmentId: mcaDept.id
            }
          }
        }
      });
    }
    const profile = await prisma.facultyProfile.findUnique({ where: { userId: user.id } });
    facultyProfiles[f.initial] = profile;
  }

  // To map correctly, we should add facultyProfileId to TimetableEntry 
  // Wait, TimetableEntry currently doesn't have facultyProfileId. 
  // Let's add it via a raw query OR schema update.
  // Actually, let's just map it via ClassAssignments. 
  // Let's map subjects to faculty based on initials.
  
  const mapSubjectToFaculty = async (code: string, initials: string[]) => {
    const sub = await prisma.subject.findFirst({ where: { code } });
    if (!sub) return;
    const sec = await prisma.section.findFirst({ where: { subjectId: sub.id } });
    if (!sec) return;

    for (const init of initials) {
      const p = facultyProfiles[init];
      if (p) {
        // Upsert assignment
        const exists = await prisma.classAssignment.findFirst({ where: { facultyProfileId: p.id, sectionId: sec.id } });
        if (!exists) {
          await prisma.classAssignment.create({ data: { facultyProfileId: p.id, sectionId: sec.id } });
        }
      }
    }
  };

  // 1st Sem Subjects based on timetable initials:
  await mapSubjectToFaculty('MCA-COA', ['AM']);
  await mapSubjectToFaculty('MCA-OS', ['SB']);
  await mapSubjectToFaculty('MCA-DAA', ['ABP']);
  await mapSubjectToFaculty('MCA-LAB', ['BG', 'AM', 'AB', 'NV', 'SB']);
  // Missing subjects from 1st sem: BC - MFCS (AB), BC - FCSN (JPG, MB), BC - IPDSC (ABP), ADS (JPG), PTPJ (BG)
  
  const createSub = async (code: string, name: string) => {
    const s = await prisma.subject.upsert({
      where: { code }, update: {}, create: { code, name, departmentId: mcaDept.id }
    });
    await prisma.section.findFirst({ where: { subjectId: s.id, name: 'A' } }) 
      || await prisma.section.create({ data: { name: 'A', subjectId: s.id } });
  }

  await createSub('MCA-BC-MFCS', 'Bridge Course - MFCS');
  await createSub('MCA-BC-FCSN', 'Bridge Course - FCSN');
  await createSub('MCA-BC-IPDSC', 'Bridge Course - IPDSC');
  await createSub('MCA-ADS', 'ADS');
  await createSub('MCA-PTPJ', 'PTPJ');

  await mapSubjectToFaculty('MCA-BC-MFCS', ['AB']);
  await mapSubjectToFaculty('MCA-BC-FCSN', ['JPG', 'MB']);
  await mapSubjectToFaculty('MCA-BC-IPDSC', ['ABP']);
  await mapSubjectToFaculty('MCA-ADS', ['JPG']);
  await mapSubjectToFaculty('MCA-PTPJ', ['BG']);

  // 3rd Sem Subjects:
  await mapSubjectToFaculty('MCA-MINI', ['ABP', 'JPG', 'SB', 'AB', 'MB', 'NV']);
  await mapSubjectToFaculty('MCA-IDS', ['BG']);
  await mapSubjectToFaculty('MCA-WTS', ['NV']);
  await mapSubjectToFaculty('MCA-AIML', ['MB', 'AB']);
  await mapSubjectToFaculty('MCA-E2', ['AB', 'AM']);
  await mapSubjectToFaculty('MCA-E3', ['NV']);

  console.log('Successfully seeded faculties and mapped them to classes!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

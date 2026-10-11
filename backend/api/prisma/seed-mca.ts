import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const students = [
  'ABHINASH SARMAH', 'ADITYA MECH', 'ANIMEGH BORO', 'APURBA SARMAH', 'BHARGAV TALUKDAR',
  'DHRITIMAN DAS', 'DIVYAM BAJPAI', 'GYANDEEP DUWARAH', 'HRISHIKESH DEKA', 'HRISHIKESH SANDILLYA',
  'KASHYAP JYOTI DAS', 'KEKHAV SONOWAL', 'KIRANMOI HANDIQUE', 'MANASH GOGOI', 'MOHIP CHOWDHURY',
  'MRIDUSMITA MANDAL', 'NAYANJYOTI ATHPORIA', 'NIRMAL JYOTI THAKURIA', 'NISHTHA RANI BORPHOOKAN',
  'PLABAN JYOTI RAJKHOWA', 'PONJIT PARBO', 'PRATIKSHA DUTTA', 'PRINCE DAS', 'PRIYANSHU PRATIM BORA',
  'PRIYANUJ GOGOI', 'PRONAYDEEP SARKAR', 'PURNITA RABHA', 'RITAM OZAH', 'SAHIBA KHANAM',
  'SHASHANKA DUTTA', 'SPONDON GOGOI', 'TOFAJUL HAQUE', 'DEEPSIKHA ENGTIPI'
];

const leftCourse = ['HRISHIKESH DEKA', 'MOHIP CHOWDHURY', 'DEEPSIKHA ENGTIPI'];

async function main() {
  console.log('Seeding MCA 2025 and 2026 records...');
  
  const passwordHash = await bcrypt.hash('Student@123', 10);
  
  // Create MCA Department
  const mcaDept = await prisma.department.findFirst({ where: { name: 'Master of Computer Applications' } }) 
    || await prisma.department.create({ data: { name: 'Master of Computer Applications', institution: 'Assam Engineering College' } });

  // Create Terms
  const term2025 = await prisma.academicTerm.create({
    data: { year: 2025, name: '1st Semester', startDate: new Date('2025-08-01'), endDate: new Date('2025-12-15'), isCurrent: false }
  });
  const term2026 = await prisma.academicTerm.create({
    data: { year: 2026, name: '3rd Semester', startDate: new Date('2026-08-01'), endDate: new Date('2026-12-15'), isCurrent: true }
  });

  // Create Subject & Section
  const mcaSubject = await prisma.subject.findFirst({ where: { code: 'MCA-101' } }) 
    || await prisma.subject.create({ data: { name: 'Programming', code: 'MCA-101', departmentId: mcaDept.id } });
  
  const mcaSection = await prisma.section.findFirst({ where: { subjectId: mcaSubject.id } })
    || await prisma.section.create({ data: { name: 'A', subjectId: mcaSubject.id } });

  console.log('Creating students...');
  const studentProfiles = [];
  
  for (let i = 0; i < students.length; i++) {
    const nameParts = students[i].split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/ /g, '')}@aec.ac.in`;
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: passwordHash,
        firstName,
        lastName,
        role: "STUDENT",
        studentProfile: {
          create: {
            enrollmentNo: `AEC-MCA-${100 + i}`,
            semester: 3,
            departmentId: mcaDept.id
          }
        }
      },
      include: { studentProfile: true }
    });
    
    if (user.studentProfile) {
      studentProfiles.push({ name: students[i], profileId: user.studentProfile.id });
      
      // Enroll in 2025 Term
      await prisma.enrollment.create({
        data: {
          studentProfileId: user.studentProfile.id,
          sectionId: mcaSection.id,
          academicTermId: term2025.id
        }
      });
      
      // Enroll in 2026 Term if not dropped out
      if (!leftCourse.includes(students[i])) {
        await prisma.enrollment.create({
          data: {
            studentProfileId: user.studentProfile.id,
            sectionId: mcaSection.id,
            academicTermId: term2026.id
          }
        });
      }
    }
  }
  
  console.log(`Created ${studentProfiles.length} student profiles and enrollments.`);
  console.log('MCA Attendance Seeding Complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

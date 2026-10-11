import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const passwordHash = await bcrypt.hash('Password@123', 10);
  
  // 1. Create Users
  console.log('Creating Admin...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aec.ac.in' },
    update: {},
    create: {
      email: 'admin@aec.ac.in',
      password: await bcrypt.hash('Admin@123', 10),
      firstName: 'AEC',
      lastName: 'Admin',
      role: "SUPER_ADMIN",
      adminProfile: { create: {} }
    }
  });

  // ================= DEPARTMENTS =================
  console.log('Creating Departments...');
  const cseDept = await prisma.department.findFirst({ where: { name: 'Computer Science and Engineering' } }) || await prisma.department.create({
    data: { name: 'Computer Science and Engineering', institution: 'Assam Engineering College, Jalukbari' }
  });
  const mcaDept = await prisma.department.findFirst({ where: { name: 'Master of Computer Applications' } }) || await prisma.department.create({
    data: { name: 'Master of Computer Applications', institution: 'Assam Engineering College, Jalukbari' }
  });
  const civilDept = await prisma.department.findFirst({ where: { name: 'Civil Engineering' } }) || await prisma.department.create({
    data: { name: 'Civil Engineering', institution: 'Assam Engineering College, Jalukbari' }
  });

  // ================= FACULTY =================
  console.log('Creating AEC Faculty...');
  
  // CSE Faculty
  const gunajitCse = await prisma.user.upsert({
    where: { email: 'gunajit.cse@aec.ac.in' },
    update: {},
    create: {
      email: 'gunajit.cse@aec.ac.in',
      password: await bcrypt.hash('Faculty@123', 10),
      firstName: 'Gunajit', lastName: 'Kalita', role: "FACULTY",
      facultyProfile: { create: { employeeId: 'EMP-AEC-CSE-01' } }
    }
  });

  // MCA Faculty
  const subhrajyotiMca = await prisma.user.upsert({
    where: { email: 'sbordoloi.mca@aec.ac.in' },
    update: {},
    create: {
      email: 'sbordoloi.mca@aec.ac.in',
      password: await bcrypt.hash('Faculty@123', 10),
      firstName: 'Subhrajyoti', lastName: 'Bordoloi', role: "FACULTY",
      facultyProfile: { create: { employeeId: 'EMP-AEC-MCA-01' } }
    }
  });
  
  const nelsonMca = await prisma.user.upsert({
    where: { email: 'nelson.mca@aec.ac.in' },
    update: {},
    create: {
      email: 'nelson.mca@aec.ac.in',
      password: await bcrypt.hash('Faculty@123', 10),
      firstName: 'Nelson', lastName: 'Varte', role: "FACULTY",
      facultyProfile: { create: { employeeId: 'EMP-AEC-MCA-02' } }
    }
  });

  // Civil Faculty
  const sasankaCivil = await prisma.user.upsert({
    where: { email: 'sborah.civil@aec.ac.in' },
    update: {},
    create: {
      email: 'sborah.civil@aec.ac.in',
      password: await bcrypt.hash('Faculty@123', 10),
      firstName: 'Sasanka', lastName: 'Borah', role: "FACULTY",
      facultyProfile: { create: { employeeId: 'EMP-AEC-CE-01' } }
    }
  });

  // ================= STUDENTS =================
  console.log('Creating AEC Students...');
  const studentCse = await prisma.user.upsert({
    where: { email: 'student.cse@aec.ac.in' },
    update: {},
    create: {
      email: 'student.cse@aec.ac.in', password: await bcrypt.hash('Student@123', 10),
      firstName: 'Rahul', lastName: 'Das', role: "STUDENT",
      studentProfile: { create: { enrollmentNo: 'AEC-CSE-2023-045', semester: 3 } }
    }
  });

  const studentMca = await prisma.user.upsert({
    where: { email: 'student.mca@aec.ac.in' },
    update: {},
    create: {
      email: 'student.mca@aec.ac.in', password: await bcrypt.hash('Student@123', 10),
      firstName: 'Priya', lastName: 'Sharma', role: "STUDENT",
      studentProfile: { create: { enrollmentNo: 'AEC-MCA-2023-012', semester: 1 } }
    }
  });

  // ================= CLASSROOMS & SUBJECTS =================
  console.log('Creating Classrooms & Subjects...');
  
  // Classrooms
  const cseHall = await prisma.classroom.findFirst({ where: { name: 'CSE Lecture Hall 1' } }) || await prisma.classroom.create({
    data: { name: 'CSE Lecture Hall 1', building: 'CSE Department Building', floor: 'Ground', departmentId: cseDept.id, latitude: 26.1415, longitude: 91.6617, allowedRadiusMeters: 100, maxGpsAccuracy: 25 }
  });
  
  const mcaLab = await prisma.classroom.findFirst({ where: { name: 'MCA Computer Lab' } }) || await prisma.classroom.create({
    data: { name: 'MCA Computer Lab', building: 'MCA Department Block', floor: '1st', departmentId: mcaDept.id, latitude: 26.1412, longitude: 91.6620, allowedRadiusMeters: 100, maxGpsAccuracy: 25 }
  });

  // Subjects & Sections
  const cs301 = await prisma.subject.upsert({
    where: { code: 'CS-301' },
    update: {},
    create: { name: 'Data Structures', code: 'CS-301', departmentId: cseDept.id, sections: { create: [{ name: 'A' }] } }
  });
  
  const mca101 = await prisma.subject.upsert({
    where: { code: 'MCA-101' },
    update: {},
    create: { name: 'Programming in C & C++', code: 'MCA-101', departmentId: mcaDept.id, sections: { create: [{ name: 'A' }] } }
  });

  // ================= ASSIGNMENTS & ENROLLMENTS =================
  console.log('Enrolling students & assigning faculty...');
  
  const cs301SecA = await prisma.section.findFirst({ where: { subjectId: cs301.id } });
  const mca101SecA = await prisma.section.findFirst({ where: { subjectId: mca101.id } });

  // CSE Mappings
  if (cs301SecA) {
    const gunajitProfile = await prisma.facultyProfile.findUnique({ where: { userId: gunajitCse.id } });
    if (gunajitProfile) {
       await prisma.classAssignment.findFirst({ where: { sectionId: cs301SecA.id, facultyProfileId: gunajitProfile.id } }) || await prisma.classAssignment.create({ data: { facultyProfileId: gunajitProfile.id, sectionId: cs301SecA.id } });
    }
    const stuCseProfile = await prisma.studentProfile.findUnique({ where: { userId: studentCse.id } });
    if (stuCseProfile) {
       await prisma.enrollment.findFirst({ where: { sectionId: cs301SecA.id, studentProfileId: stuCseProfile.id } }) || await prisma.enrollment.create({ data: { studentProfileId: stuCseProfile.id, sectionId: cs301SecA.id } });
    }
  }

  // MCA Mappings
  if (mca101SecA) {
    const subhrajyotiProfile = await prisma.facultyProfile.findUnique({ where: { userId: subhrajyotiMca.id } });
    if (subhrajyotiProfile) {
       await prisma.classAssignment.findFirst({ where: { sectionId: mca101SecA.id, facultyProfileId: subhrajyotiProfile.id } }) || await prisma.classAssignment.create({ data: { facultyProfileId: subhrajyotiProfile.id, sectionId: mca101SecA.id } });
    }
    const stuMcaProfile = await prisma.studentProfile.findUnique({ where: { userId: studentMca.id } });
    if (stuMcaProfile) {
       await prisma.enrollment.findFirst({ where: { sectionId: mca101SecA.id, studentProfileId: stuMcaProfile.id } }) || await prisma.enrollment.create({ data: { studentProfileId: stuMcaProfile.id, sectionId: mca101SecA.id } });
    }
  }

  console.log('AEC Seeding complete! ✨');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

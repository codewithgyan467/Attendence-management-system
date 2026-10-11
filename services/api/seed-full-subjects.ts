import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const subjects = [
  // Semester 1
  { code: 'MCA182101', name: 'Introductory Programming' },
  { code: 'MCA182102', name: 'Digital Systems' },
  { code: 'MCA182103', name: 'Mathematical Foundation of Computer Science' },
  { code: 'MCA182104', name: 'Accounting and Financial Management' },
  { code: 'MCA182105', name: 'Numerical Computation and Statistical Methods' },
  { code: 'MCA182116', name: 'Laboratory-I' },
  // Semester 2
  { code: 'MCA182201', name: 'Data Structure and Algorithms' },
  { code: 'MCA182202', name: 'Computer Organisation' },
  { code: 'MCA182203', name: 'Computer Based Optimisation Techniques' },
  { code: 'MCA182204', name: 'Combinatorics Graph Theory' },
  { code: 'MCA182205', name: 'System Softwares' },
  { code: 'MCA182216', name: 'Laboratory-II (C++, DSA, Microcontroller)' },
  // Semester 3
  { code: 'MCA182301', name: 'Operating Systems' },
  { code: 'MCA182302', name: 'Design and Analysis of Algorithms' },
  { code: 'MCA182303', name: 'Database Management Systems' },
  { code: 'MCA182304', name: 'Object Oriented Programming and Design' },
  { code: 'MCA182305', name: 'Computer Graphics and Multimedia' },
  { code: 'MCA182316', name: 'Laboratory-III (DBMS, OOPD, PYTHON, LINUX Lab)' },
  // Semester 5
  { code: 'MCA182501', name: 'Computer Networks-II' },
  { code: 'MCA182502', name: 'Artificial Intelligence' },
  { code: 'MCA18250E21', name: 'Soft Computing' },
  { code: 'MCA18250E22', name: 'Computer Architecture' },
  { code: 'MCA18250E31', name: 'Distributed Systems' },
  { code: 'MCA18250E32', name: 'Image Processing' },
  { code: 'MCA18250E33', name: 'Mobile Computing' },
  { code: 'MCA18250E34', name: 'Big Data Analytics' },
  { code: 'MCA18250E41', name: 'Remote Sensing and GIS' },
  { code: 'MCA18250E42', name: 'Cloud Computing' },
  { code: 'MCA182521', name: 'Seminar and Mini Project' },
  // Semester 6
  { code: 'MCA182621', name: 'Major Project' },
];

async function main() {
  console.log('Seeding full MCA subject list...');
  
  const mcaDept = await prisma.department.upsert({
    where: { id: 'mca-dept-id' }, // use findFirst normally
    update: {},
    create: { name: 'Computer Applications', institution: 'Assam Engineering College' }
  }).catch(async () => {
    let dept = await prisma.department.findFirst({ where: { name: 'Computer Applications' } });
    if (!dept) {
      dept = await prisma.department.create({ data: { name: 'Computer Applications', institution: 'Assam Engineering College' } });
    }
    return dept;
  });

  for (const sub of subjects) {
    await prisma.subject.upsert({
      where: { code: sub.code },
      update: { name: sub.name, departmentId: mcaDept.id },
      create: { 
        name: sub.name, 
        code: sub.code, 
        departmentId: mcaDept.id 
      }
    });
  }

  // Remove old subjects like MCA-DSA that are fake
  await prisma.subject.deleteMany({
    where: {
      code: { startsWith: 'MCA-' }
    }
  });

  console.log(`Successfully seeded ${subjects.length} subjects!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

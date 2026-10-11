import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const subjects = [
  { code: 'MCA-COA', name: 'Computer Organization & Architecture' },
  { code: 'MCA-OS', name: 'Operating Systems' },
  { code: 'MCA-ADBMS', name: 'Advanced Database Management Systems' },
  { code: 'MCA-DAA', name: 'Design and Analysis of Algorithms' },
  { code: 'MCA-PYTHON', name: 'Python Programming' },
  { code: 'MCA-LAB', name: 'Practical Lab' }
];

async function main() {
  console.log('Adding MCA Syllabus Modules to the database...');
  
  // Find or create MCA Department
  const mcaDept = await prisma.department.findFirst({ where: { name: 'Master of Computer Applications' } }) 
    || await prisma.department.create({ data: { name: 'Master of Computer Applications', institution: 'Assam Engineering College' } });

  // Add subjects to the department
  for (const sub of subjects) {
    const subject = await prisma.subject.upsert({
      where: { code: sub.code },
      update: {},
      create: { 
        name: sub.name, 
        code: sub.code, 
        departmentId: mcaDept.id 
      }
    });

    // Ensure a default section 'A' exists for each subject
    await prisma.section.findFirst({ where: { subjectId: subject.id, name: 'A' } })
      || await prisma.section.create({ data: { name: 'A', subjectId: subject.id } });
  }

  console.log(`Successfully added ${subjects.length} MCA subjects to the database!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const additionalSubjects = [
  // Semester 2
  { code: 'MCA-DSA', name: 'Data Structures & Algorithms' },
  { code: 'MCA-SE', name: 'Software Engineering' },
  { code: 'MCA-CN', name: 'Computer Networks' },
  { code: 'MCA-WT', name: 'Web Technologies' },
  { code: 'MCA-JAVA', name: 'Advanced Java Programming' },
  { code: 'MCA-LAB2', name: 'Web & Java Lab' },
  
  // Semester 3
  { code: 'MCA-AI', name: 'Artificial Intelligence' },
  { code: 'MCA-ML', name: 'Machine Learning' },
  { code: 'MCA-CC', name: 'Cloud Computing' },
  { code: 'MCA-CNS', name: 'Cryptography & Network Security' },
  { code: 'MCA-MAD', name: 'Mobile Application Development' },
  { code: 'MCA-LAB3', name: 'AI & Mobile App Lab' },
  
  // Semester 4
  { code: 'MCA-PROJ', name: 'Major Project' },
  { code: 'MCA-SEM', name: 'Seminar & Presentation' },
  { code: 'MCA-INT', name: 'Industrial Training / Internship' }
];

async function main() {
  console.log('Adding additional MCA subjects for Semesters 2, 3, and 4...');
  
  const mcaDept = await prisma.department.findFirst({ where: { name: 'Master of Computer Applications' } }) 
    || await prisma.department.create({ data: { name: 'Master of Computer Applications', institution: 'Assam Engineering College' } });

  let added = 0;
  for (const sub of additionalSubjects) {
    const subject = await prisma.subject.upsert({
      where: { code: sub.code },
      update: {},
      create: { 
        name: sub.name, 
        code: sub.code, 
        departmentId: mcaDept.id 
      }
    });

    const sectionExists = await prisma.section.findFirst({ where: { subjectId: subject.id, name: 'A' } });
    if (!sectionExists) {
      await prisma.section.create({ data: { name: 'A', subjectId: subject.id } });
      added++;
    }
  }

  console.log(`Successfully seeded ${additionalSubjects.length} subjects!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

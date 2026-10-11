import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const students = [
  { name: 'Abhinash Sarmah', enrollmentNo: '2581200876' },
  { name: 'Aditya Mech', enrollmentNo: '2581200877' },
  { name: 'Animegh Boro', enrollmentNo: '2581200878' },
  { name: 'Apurba Sarmah', enrollmentNo: '2581200879' },
  { name: 'Bhargav Talukdar', enrollmentNo: '2581200880' },
  { name: 'Dhritiman Das', enrollmentNo: '2581200881' },
  { name: 'Divyam Bajpai', enrollmentNo: '2581200882' },
  { name: 'Gyandeep Duwarah', enrollmentNo: '2581200883' },
  { name: 'Hrishikesh Sandillya', enrollmentNo: '2581200884' },
  { name: 'Kashyap Jyoti Das', enrollmentNo: '2581200885' },
  { name: 'Kekhav Sonowal', enrollmentNo: '2581200886' },
  { name: 'Kiranmoi Handique', enrollmentNo: '2581200887' },
  { name: 'Manash Gogoi', enrollmentNo: '2581200888' },
  // Mohip Chowdhury removed
  { name: 'Mridusmita Mandal', enrollmentNo: '2581200890' },
  { name: 'Nirmal Jyoti Thakuria', enrollmentNo: '2581200891' },
  { name: 'Nishtha Rani Borphookan', enrollmentNo: '2581200892' },
  { name: 'Plaban Jyoti Rajkhowa', enrollmentNo: '2581200893' },
  { name: 'Ponjit Parbo', enrollmentNo: '2581200894' },
  { name: 'Pratiksha Dutta', enrollmentNo: '2581200895' },
  { name: 'Prince Das', enrollmentNo: '2581200896' },
  { name: 'Priyanshu Pratim Bora', enrollmentNo: '2581200897' },
  { name: 'Priyanuj Gogoi', enrollmentNo: '2581200898' },
  { name: 'Pronaydeep Sarkar', enrollmentNo: '2581200899' },
  { name: 'Purnita Rabha', enrollmentNo: '2581200900' },
  { name: 'Ritam Ozah', enrollmentNo: '2581200901' },
  { name: 'Sahiba Khanam', enrollmentNo: '2581200902' },
  { name: 'SHASHANKA DUTTA', enrollmentNo: '2581200903' },
  { name: 'Spondon Gogoi', enrollmentNo: '2581200904' },
  { name: 'TOFAJUL HAQUE', enrollmentNo: '2581200905' },
  { name: 'Nayanjyoti Athporia', enrollmentNo: '2581200971' }
];

async function main() {
  const hashedPassword = await bcrypt.hash('Student@123', 10);

  const enrollmentNos = students.map(s => s.enrollmentNo);

  // Upsert all students
  for (const student of students) {
    const nameParts = student.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Convert e.g. "Abhinash Sarmah" -> "abhinash.sarmah@aec.ac.in"
    const emailPrefix = student.name.toLowerCase().replace(/\s+/g, '.');
    const email = `${emailPrefix}@aec.ac.in`;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          password: hashedPassword,
          role: 'STUDENT'
        }
      });
    } else {
      // Just to be sure, if user exists but has wrong first/last name
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firstName, lastName }
      });
    }

    // Upsert StudentProfile
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        enrollmentNo: student.enrollmentNo,
        semester: 1
      },
      create: {
        userId: user.id,
        enrollmentNo: student.enrollmentNo,
        semester: 1
      }
    });
    console.log(`Upserted ${student.name} with enrollment ${student.enrollmentNo}`);
  }

  // Delete all students not in this list
  const existingProfiles = await prisma.studentProfile.findMany({
    include: { user: true }
  });

  for (const profile of existingProfiles) {
    if (!enrollmentNos.includes(profile.enrollmentNo)) {
      console.log(`Deleting ${profile.user.email} (Enrollment: ${profile.enrollmentNo})`);
      
      // Clean up relations first
      await prisma.attendanceRecord.deleteMany({ where: { studentProfileId: profile.id } });
      await prisma.enrollment.deleteMany({ where: { studentProfileId: profile.id } });
      await prisma.faceProfile.deleteMany({ where: { studentProfileId: profile.id } });
      await prisma.feedbackTicket.deleteMany({ where: { studentProfileId: profile.id } });

      await prisma.studentProfile.delete({ where: { id: profile.id } });
      await prisma.user.delete({ where: { id: profile.userId } });
    }
  }

  console.log('Update complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());

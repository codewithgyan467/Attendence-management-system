import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Universal Institution & Academic Routine Migration for Assam Engineering College...');

  // 1. Institution Setup (Universal scaling model)
  const instId = 'inst-aec-guwahati';
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Institution" (id, name, code, address, city, state, country, latitude, longitude, "allowedRadiusMeters", "createdAt", "updatedAt")
    VALUES ('${instId}', 'Assam Engineering College', 'AEC', 'Jalukbari, Guwahati, Assam 781013', 'Guwahati', 'Assam', 'India', 26.140537, 91.656738, 500, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE 
    SET name = EXCLUDED.name,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        "allowedRadiusMeters" = EXCLUDED."allowedRadiusMeters",
        "updatedAt" = NOW();
  `);
  console.log('✅ Institution registered: Assam Engineering College (AEC)');

  // 2. Department Setup
  let mcaDept = await prisma.department.findFirst({
    where: { name: { in: ['Master of Computer Applications', 'Computer Applications', 'Department of Computer Applications'] } }
  });

  if (!mcaDept) {
    mcaDept = await prisma.department.create({
      data: {
        name: 'Department of Computer Applications',
        institution: 'Assam Engineering College',
        institutionId: instId
      }
    });
  } else {
    mcaDept = await prisma.department.update({
      where: { id: mcaDept.id },
      data: {
        name: 'Department of Computer Applications',
        institution: 'Assam Engineering College',
        institutionId: instId
      }
    });
  }
  console.log(`✅ Department configured: ${mcaDept.name} (ID: ${mcaDept.id})`);

  // 3. Classroom Setup with exact tested GPS Coordinates
  let classroom = await prisma.classroom.findFirst({
    where: { departmentId: mcaDept.id }
  });

  if (!classroom) {
    classroom = await prisma.classroom.create({
      data: {
        name: 'MCA Computer Lab / Hall 1',
        building: 'MCA Department Block',
        floor: 'Ground Floor',
        departmentId: mcaDept.id,
        latitude: 26.140537,
        longitude: 91.656738,
        allowedRadiusMeters: 500,
        maxGpsAccuracy: 50
      }
    });
  } else {
    classroom = await prisma.classroom.update({
      where: { id: classroom.id },
      data: {
        name: 'MCA Computer Lab / Hall 1',
        building: 'MCA Department Block',
        floor: 'Ground Floor',
        latitude: 26.140537,
        longitude: 91.656738,
        allowedRadiusMeters: 500,
        maxGpsAccuracy: 50
      }
    });
  }
  console.log(`✅ Classroom configured: ${classroom.name} at coordinates 26.140537, 91.656738`);

  // 4. Sync & Standardize the 8 Official MCA Faculty Members
  const facultyData = [
    { code: 'BG', first: 'Bornali', last: 'Gogoi', email: 'bg.mca@aec.ac.in', empId: 'FAC-BG-08', phone: '+91 94350 00008' },
    { code: 'ABP', first: 'Amrita', last: 'Bose Paul', email: 'abp.mca@aec.ac.in', empId: 'FAC-ABP-07', phone: '+91 94350 00007' },
    { code: 'SB', first: 'Subhrajyoti', last: 'Bordoloi', email: 'sb.mca@aec.ac.in', empId: 'FAC-SB-01', phone: '+91 94350 00001' },
    { code: 'NV', first: 'Nelson', last: 'Varte', email: 'nv.mca@aec.ac.in', empId: 'FAC-NV-02', phone: '+91 94350 00002' },
    { code: 'AB', first: 'Anindita', last: 'Borah', email: 'ab.mca@aec.ac.in', empId: 'FAC-AB-06', phone: '+91 94350 00006' },
    { code: 'AM', first: 'Antara', last: 'Malakar', email: 'am.mca@aec.ac.in', empId: 'FAC-AM-05', phone: '+91 94350 00005' },
    { code: 'JPG', first: 'Jyoti Prakash', last: 'Goswami', email: 'jpg.mca@aec.ac.in', empId: 'FAC-JPG-04', phone: '+91 94350 00004' },
    { code: 'MB', first: 'Maushumi', last: 'Boroah', email: 'mb.mca@aec.ac.in', empId: 'FAC-MB-03', phone: '+91 94350 00003' },
  ];

  const facultyMap = {}; // code -> facultyProfile

  for (const f of facultyData) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: f.email },
          { facultyProfile: { employeeId: f.empId } }
        ]
      },
      include: { facultyProfile: true }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: f.email,
          phone: f.phone,
          password: '$2b$10$w4r6qVJnIq0vB7vQe9kQ6u1mU9jXw7yL3o2a5c8e1g4i7k0m3o6q8', // Secure hashed default
          firstName: f.first,
          lastName: f.last,
          role: 'FACULTY',
          facultyProfile: {
            create: {
              employeeId: f.empId,
              departmentId: mcaDept.id
            }
          }
        },
        include: { facultyProfile: true }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: f.first,
          lastName: f.last,
          role: 'FACULTY',
        },
        include: { facultyProfile: true }
      });

      if (!user.facultyProfile) {
        await prisma.facultyProfile.create({
          data: {
            userId: user.id,
            employeeId: f.empId,
            departmentId: mcaDept.id
          }
        });
      } else {
        await prisma.facultyProfile.update({
          where: { id: user.facultyProfile.id },
          data: { departmentId: mcaDept.id }
        });
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { facultyProfile: true }
    });
    facultyMap[f.code] = updatedUser.facultyProfile;
    console.log(`👤 Faculty ready: ${f.first} ${f.last} (${f.code})`);
  }

  // 5. Academic Terms (Matching routine image dates)
  // Routine: 1st Sem wef 17/08/2026, 3rd Sem wef 03/08/2026
  let term1st = await prisma.academicTerm.findFirst({
    where: { name: { contains: '1st Semester' } }
  });
  if (!term1st) {
    term1st = await prisma.academicTerm.create({
      data: {
        name: 'MCA 1st Semester (2026)',
        year: 2026,
        startDate: new Date('2026-08-17'),
        endDate: new Date('2026-12-20'),
        isCurrent: true
      }
    });
  } else {
    term1st = await prisma.academicTerm.update({
      where: { id: term1st.id },
      data: {
        name: 'MCA 1st Semester (2026)',
        year: 2026,
        startDate: new Date('2026-08-17'),
        endDate: new Date('2026-12-20'),
        isCurrent: true
      }
    });
  }

  let term3rd = await prisma.academicTerm.findFirst({
    where: { name: { contains: '3rd Semester' } }
  });
  if (!term3rd) {
    term3rd = await prisma.academicTerm.create({
      data: {
        name: 'MCA 3rd Semester (2026)',
        year: 2026,
        startDate: new Date('2026-08-03'),
        endDate: new Date('2026-12-20'),
        isCurrent: true
      }
    });
  } else {
    term3rd = await prisma.academicTerm.update({
      where: { id: term3rd.id },
      data: {
        name: 'MCA 3rd Semester (2026)',
        year: 2026,
        startDate: new Date('2026-08-03'),
        endDate: new Date('2026-12-20'),
        isCurrent: true
      }
    });
  }
  console.log('✅ Academic Terms configured for 1st Sem and 3rd Sem');

  // 6. CLEAR ALL PREVIOUS ACADEMIC ROUTINE RECORDS
  console.log('🧹 Clearing previous routine records (preserving users and profiles)...');
  await prisma.timetableEntry.deleteMany({});
  await prisma.classAssignment.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.section.deleteMany({});
  await prisma.subject.deleteMany({
    where: { departmentId: mcaDept.id }
  });
  console.log('✅ Clean slate prepared for new routine and subjects!');

  // 7. Define Subject Catalog with exact syllabus and faculty
  const catalog = [
    // --- 1st SEMESTER ---
    {
      code: 'MCA-101',
      name: 'Computer Organization and Architecture (COA)',
      semester: 1,
      type: 'Theory',
      faculties: ['AM'],
      syllabus: `• Module 1: CPU Architecture (Instruction sets, addressing modes, ALU, control unit design)\n• Module 2: Computer Arithmetic (Fixed-point, floating-point, multiplication & division algorithms)\n• Module 3: I/O Architecture (Interrupt handling, DMA controllers, peripheral interfaces)\n• Module 4: Advanced Memory Concepts (Cache hierarchy, mapping techniques, virtual memory, memory management)`
    },
    {
      code: 'MCA-102',
      name: 'Design and Analysis of Algorithms (DAA)',
      semester: 1,
      type: 'Theory',
      faculties: ['ABP'],
      syllabus: `• Module 1: Introduction (Asymptotic notations, recurrences, divide-and-conquer)\n• Module 2: Design and Analysis Techniques (Dynamic programming, greedy approach, amortized analysis)\n• Module 3: Greedy Algorithms & Dynamic Programming (Knapsack, Huffman coding, Bellman-Ford, Floyd-Warshall)\n• Module 4: Graph Algorithms (BFS, DFS, Minimum Spanning Trees, Shortest paths)\n• Module 5: Concept of different Problem classes and Approximation Algorithms (P, NP, NP-Complete, vertex cover)`
    },
    {
      code: 'MCA-103',
      name: 'Programming Techniques using Python and Java (PTPJ)',
      semester: 1,
      type: 'Theory',
      faculties: ['BG'],
      syllabus: `• Part 1 (Java): Introduction to Java, OOP paradigms, Inheritance & Polymorphism, Exception handling, Event-driven & GUI programming with Swing/JavaFX\n• Part 2 (Python): Python syntax & control flow, loops, bitwise operators, OOP with Python classes, standard library modules, decorators & generators`
    },
    {
      code: 'MCA-104',
      name: 'Advanced Database Systems (ADS)',
      semester: 1,
      type: 'Theory',
      faculties: ['JPG'],
      syllabus: `• Modules 1-8:\n1. Introduction to Relational Database Design\n2. Entity Relationship Models & Extended ER\n3. ACID Transactions & Concurrency Control\n4. Database Recovery Systems & Logging\n5. Query Processing & Optimization\n6. Parallel Databases & Partitioning\n7. Distributed Databases & 2PC Protocols\n8. Database Security, Role-Based Access & Integrity Constraints`
    },
    {
      code: 'MCA-105',
      name: 'Operating Systems (OS)',
      semester: 1,
      type: 'Theory',
      faculties: ['SB'],
      syllabus: `• Modules 1-6:\n1. Introduction to OS Kernel & Architecture\n2. Process Management, Scheduling & Inter-Process Communication (IPC)\n3. I/O Systems, Device Drivers & Interrupt Handling\n4. Memory Management, Paging, Segmentation & Virtual Memory\n5. File System Implementation & Disk Management (RAID)\n6. Case study of Modern Operating Systems (Linux/Unix internals)`
    },
    {
      code: 'MCA-106',
      name: 'Programming Lab Project (LAB PJ)',
      semester: 1,
      type: 'Lab',
      faculties: ['BG', 'AM', 'AB', 'NV'],
      syllabus: `• Hands-on laboratory sessions implementing algorithms in Python and Java\n• Database connectivity (JDBC, Python SQLite/PostgreSQL connectors)\n• GUI application development and end-of-semester software mini-project submission`
    },
    {
      code: 'MCA-BC-MFCS',
      name: 'BC - Mathematical Foundation of Computer Science (MFCS)',
      semester: 1,
      type: 'Bridge Course',
      faculties: ['AB'],
      syllabus: `• Sets, Functions, Relations & Equivalence Classes\n• Matrices, Determinants, Matrix Inversion & Linear Systems\n• Mathematical Logic & Propositional Calculus\n• Formal Logic & Proof Techniques\n• Combinatorics & Counting Principles\n• Probability Theory, Random Variables & Statistical Concepts`
    },
    {
      code: 'MCA-BC-FCSN',
      name: 'BC - Fundamentals of Computer Systems and Networking (FCSN)',
      semester: 1,
      type: 'Bridge Course',
      faculties: ['JPG', 'MB'],
      syllabus: `• Representation of Information (Binary, Hex, Two's complement)\n• Digital Logic Gates, Boolean Algebra & Combinational Circuits\n• Introduction to Computer Networks (OSI & TCP/IP stack)\n• Physical Layer & Transmission Media`
    },
    {
      code: 'MCA-BC-IPDSC',
      name: 'BC - Introductory Programming and Data Structures using C (IPDSC)',
      semester: 1,
      type: 'Bridge Course',
      faculties: ['ABP'],
      syllabus: `• Introduction to Computers, CPU Architecture & Machine Language\n• Memory Hierarchy & Programming Language Translators\n• Problem Solving with C Programming (Variables, Loops, Functions, Pointers)\n• Arrays, Structures, Unions & Dynamic Memory Allocation\n• Sorting & Searching Algorithms\n• Linear Data Structures (Stacks, Queues, Linked Lists)`
    },
    {
      code: 'MCA-BC-LAB-CDS',
      name: 'BC - Lab CDS (Bridge Course Lab C & Data Structures)',
      semester: 1,
      type: 'Lab',
      faculties: ['SB', 'AM'],
      syllabus: `• Practical C programming lab assignments covering pointers, structures, file handling, and linked list data structure implementations`
    },

    // --- 3rd SEMESTER ---
    {
      code: 'MCA-301',
      name: 'Artificial Intelligence and Machine Learning (AIML)',
      semester: 3,
      type: 'Theory',
      faculties: ['AB', 'MB'],
      syllabus: `• Modules 1-6:\n1. Introduction to AI Principles & Agent Paradigms\n2. Problem Solving with AI Search Techniques (A*, Heuristics, Alpha-Beta Minimax)\n3. Knowledge Representation, First-Order Logic & Grammars\n4. Expert Systems & Inference Engines\n5. Introduction to Machine Learning (Supervised/Unsupervised, Regressions, Decision Trees)\n6. Practical Machine Learning Frameworks (TensorFlow or R)`
    },
    {
      code: 'MCA-302',
      name: 'Web Technology and Services (WTS)',
      semester: 3,
      type: 'Theory',
      faculties: ['NV'],
      syllabus: `• Modules 1-5:\n1. Introduction to Web Technology (HTTP/HTTPS protocols, DOM, responsive design)\n2. Web Application Development (Client-side frameworks, asynchronous API consumption)\n3. Web Security (XSS, CSRF, SQL Injection, HTTPS, JWT authorization)\n4. Web Services & Web Object Model (RESTful APIs, GraphQL, Microservices architecture)\n5. Modern Frameworks & Web Content Management Systems`
    },
    {
      code: 'MCA-303',
      name: 'Introduction to Data Science (IDS)',
      semester: 3,
      type: 'Theory',
      faculties: ['BG'],
      syllabus: `• Modules 1-6:\n1. Statistics for Data Science (Probability distributions, hypothesis testing)\n2. Introduction to Data Mining & Preprocessing\n3. Core Predictive Algorithms & Classification\n4. Deep Learning Computation Basics\n5. Artificial Neural Networks (Feedforward, backpropagation, activation functions)\n6. Natural Language Processing (Tokenization, TF-IDF, sentiment analysis)`
    },
    {
      code: 'MCA-304-CD',
      name: 'Elective II - Compiler Design (CD)',
      semester: 3,
      type: 'Elective',
      faculties: ['AB'],
      syllabus: `• Modules 1-5:\n1. Compiler Structure Overview & Phases\n2. Lexical Analysis (Regular expressions, Finite automata, Lex/Flex)\n3. Syntax Analysis (Context-Free Grammars, LL(1), LR parsing, Yacc/Bison)\n4. Intermediate-Code Generation & Code Optimization techniques\n5. Introduction to Data-Flow Analysis & Register Allocation`
    },
    {
      code: 'MCA-304-CNS',
      name: 'Elective II - Cryptography and Network Security (CNS)',
      semester: 3,
      type: 'Elective',
      faculties: ['AM'],
      syllabus: `• Modules 1-5:\n1. Introduction to Information Security Principles\n2. Symmetric Key Cryptography (DES, AES, Block Cipher Modes)\n3. Public Key Cryptography (RSA, ECC, Diffie-Hellman Key Exchange)\n4. Message Authentication Codes (MAC), Hashing (SHA-256) & Digital Signatures\n5. Security Practice & Network Protocols (IPSec, SSL/TLS, Firewalls)`
    },
    {
      code: 'MCA-305-ES',
      name: 'Elective III - Embedded Systems (ES)',
      semester: 3,
      type: 'Elective',
      faculties: ['NV'],
      syllabus: `• Modules 1-5:\n1. Introduction to Embedded Systems & Microcontrollers\n2. Embedded Hardware Architecture (ARM, ESP32, Timers, Interrupts)\n3. Embedded C Programming & Firmware Development\n4. Real-Time Operating Systems (RTOS concepts, tasks, semaphores)\n5. Development, Hardware Debugging & Testing Protocols`
    },
    {
      code: 'MCA-306-MINI',
      name: 'Mini Project and Seminar',
      semester: 3,
      type: 'Seminar',
      faculties: ['ABP', 'JPG', 'SB', 'AB', 'MB', 'NV'],
      syllabus: `• 12-week iterative development of Web / Android / Embedded / Database application systems\n• Seminars and technical research presentations on contemporary topics in Computer Science and Engineering`
    },
    {
      code: 'MCA-NBA',
      name: 'NBA Work',
      semester: 3,
      type: 'Activity',
      faculties: ['AB', 'AM', 'ABP', 'BG', 'JPG', 'MB', 'NV', 'SB'],
      syllabus: `• Departmental documentation, continuous internal assessment auditing, and outcome-based education (OBE) evaluation under National Board of Accreditation (NBA) guidelines`
    }
  ];

  const sectionMap = {}; // code -> Section

  for (const item of catalog) {
    const subject = await prisma.subject.create({
      data: {
        code: item.code,
        name: item.name,
        departmentId: mcaDept.id,
        semester: item.semester,
        type: item.type,
        syllabus: item.syllabus
      }
    });

    const section = await prisma.section.create({
      data: {
        name: `Sec A (${item.code})`,
        subjectId: subject.id
      }
    });
    sectionMap[item.code] = section;

    // Assign faculty
    for (const fCode of item.faculties) {
      const fProf = facultyMap[fCode];
      if (fProf) {
        await prisma.classAssignment.create({
          data: {
            facultyProfileId: fProf.id,
            sectionId: section.id
          }
        });
      }
    }
    console.log(`📚 Subject registered: [${item.code}] ${item.name} (Sem ${item.semester})`);
  }

  // 8. Re-Enroll Existing Students
  const students = await prisma.studentProfile.findMany();
  console.log(`👥 Enrolling ${students.length} existing students into clean semester subjects...`);

  const sem1Sections = catalog.filter(c => c.semester === 1).map(c => sectionMap[c.code]);
  const sem3Sections = catalog.filter(c => c.semester === 3).map(c => sectionMap[c.code]);

  for (const student of students) {
    const targetSections = student.semester === 3 ? sem3Sections : sem1Sections;
    const targetTerm = student.semester === 3 ? term3rd : term1st;

    for (const sec of targetSections) {
      if (sec) {
        await prisma.enrollment.create({
          data: {
            studentProfileId: student.id,
            sectionId: sec.id,
            academicTermId: targetTerm.id
          }
        });
      }
    }
  }
  console.log('✅ All students successfully enrolled in their respective semester subjects!');

  // 9. Populate the Complete Routine matching AEC Class Routine Image
  // Days: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const timetableSlots = [
    // ==========================================
    // MONDAY (Day 1)
    // ==========================================
    // Sem 1
    { term: term1st, code: 'MCA-BC-MFCS', day: 1, start: '08:00', end: '09:00', type: 'Bridge Course', f: 'AB' },
    { term: term1st, code: 'MCA-106',     day: 1, start: '09:00', end: '11:00', type: 'Lab',           f: 'BG' },
    { term: term1st, code: 'MCA-BC-FCSN', day: 1, start: '11:00', end: '12:00', type: 'Bridge Course', f: 'JPG' },
    { term: term1st, code: 'MCA-102',     day: 1, start: '13:00', end: '14:00', type: 'Theory',        f: 'ABP' },
    { term: term1st, code: 'MCA-101',     day: 1, start: '14:00', end: '15:00', type: 'Theory',        f: 'AM' },
    { term: term1st, code: 'MCA-104',     day: 1, start: '15:00', end: '16:00', type: 'Theory',        f: 'JPG' },
    // Sem 3
    { term: term3rd, code: 'MCA-306-MINI', day: 1, start: '08:00', end: '10:00', type: 'Seminar',  f: 'ABP' },
    { term: term3rd, code: 'MCA-304-CD',   day: 1, start: '10:00', end: '11:00', type: 'Elective', f: 'AB, AM' },
    { term: term3rd, code: 'MCA-303',      day: 1, start: '11:00', end: '12:00', type: 'Theory',   f: 'BG' },
    { term: term3rd, code: 'MCA-302',      day: 1, start: '13:00', end: '14:00', type: 'Theory',   f: 'NV' },
    { term: term3rd, code: 'MCA-NBA',      day: 1, start: '14:00', end: '16:00', type: 'Activity', f: 'NBA' },

    // ==========================================
    // TUESDAY (Day 2)
    // ==========================================
    // Sem 1
    { term: term1st, code: 'MCA-105',      day: 2, start: '08:00', end: '09:00', type: 'Theory',        f: 'SB' },
    { term: term1st, code: 'MCA-106',      day: 2, start: '09:00', end: '11:00', type: 'Lab',           f: 'AM' },
    { term: term1st, code: 'MCA-103',      day: 2, start: '11:00', end: '12:00', type: 'Theory',        f: 'BG' },
    { term: term1st, code: 'MCA-BC-IPDSC', day: 2, start: '13:00', end: '14:00', type: 'Bridge Course', f: 'ABP' },
    { term: term1st, code: 'MCA-BC-MFCS',  day: 2, start: '14:00', end: '15:00', type: 'Bridge Course', f: 'AB' },
    { term: term1st, code: 'MCA-103',      day: 2, start: '15:00', end: '16:00', type: 'Tutorial',      f: 'BG' },
    // Sem 3
    { term: term3rd, code: 'MCA-306-MINI', day: 2, start: '08:00', end: '10:00', type: 'Seminar',  f: 'JPG' },
    { term: term3rd, code: 'MCA-305-ES',   day: 2, start: '10:00', end: '11:00', type: 'Elective', f: 'NV' },
    { term: term3rd, code: 'MCA-301',      day: 2, start: '11:00', end: '12:00', type: 'Theory',   f: 'MB' },
    { term: term3rd, code: 'MCA-303',      day: 2, start: '13:00', end: '14:00', type: 'Theory',   f: 'BG' },
    { term: term3rd, code: 'MCA-302',      day: 2, start: '14:00', end: '15:00', type: 'Theory',   f: 'NV' },
    { term: term3rd, code: 'MCA-304-CNS',  day: 2, start: '15:00', end: '16:00', type: 'Elective', f: 'AB, AM' },

    // ==========================================
    // WEDNESDAY (Day 3)
    // ==========================================
    // Sem 1
    { term: term1st, code: 'MCA-BC-IPDSC', day: 3, start: '08:00', end: '09:00', type: 'Bridge Course', f: 'ABP' },
    { term: term1st, code: 'MCA-106',      day: 3, start: '09:00', end: '11:00', type: 'Lab',           f: 'AB' },
    { term: term1st, code: 'MCA-101',      day: 3, start: '11:00', end: '12:00', type: 'Theory',        f: 'AM' },
    { term: term1st, code: 'MCA-104',      day: 3, start: '13:00', end: '14:00', type: 'Theory',        f: 'JPG' },
    { term: term1st, code: 'MCA-BC-FCSN',  day: 3, start: '14:00', end: '15:00', type: 'Bridge Course', f: 'MB' },
    { term: term1st, code: 'MCA-105',      day: 3, start: '15:00', end: '16:00', type: 'Tutorial',      f: 'SB' },
    // Sem 3
    { term: term3rd, code: 'MCA-306-MINI', day: 3, start: '08:00', end: '10:00', type: 'Seminar',  f: 'SB' },
    { term: term3rd, code: 'MCA-305-ES',   day: 3, start: '10:00', end: '11:00', type: 'Elective', f: 'NV' },
    { term: term3rd, code: 'MCA-303',      day: 3, start: '11:00', end: '12:00', type: 'Theory',   f: 'BG' },
    { term: term3rd, code: 'MCA-304-CD',   day: 3, start: '13:00', end: '14:00', type: 'Elective', f: 'AB, AM' },
    { term: term3rd, code: 'MCA-301',      day: 3, start: '14:00', end: '15:00', type: 'Tutorial', f: 'AB' },
    { term: term3rd, code: 'MCA-302',      day: 3, start: '15:00', end: '16:00', type: 'Theory',   f: 'NV' },

    // ==========================================
    // THURSDAY (Day 4)
    // ==========================================
    // Sem 1
    { term: term1st, code: 'MCA-105',      day: 4, start: '08:00', end: '09:00', type: 'Theory',        f: 'SB' },
    { term: term1st, code: 'MCA-106',      day: 4, start: '09:00', end: '11:00', type: 'Lab',           f: 'NV' },
    { term: term1st, code: 'MCA-103',      day: 4, start: '11:00', end: '12:00', type: 'Theory',        f: 'BG' },
    { term: term1st, code: 'MCA-102',      day: 4, start: '13:00', end: '14:00', type: 'Theory',        f: 'ABP' },
    { term: term1st, code: 'MCA-102',      day: 4, start: '14:00', end: '15:00', type: 'Tutorial',      f: 'ABP' },
    { term: term1st, code: 'MCA-BC-FCSN',  day: 4, start: '15:00', end: '16:00', type: 'Bridge Course', f: 'MB' },
    // Sem 3
    { term: term3rd, code: 'MCA-306-MINI', day: 4, start: '08:00', end: '11:00', type: 'Seminar',  f: 'AB' },
    { term: term3rd, code: 'MCA-301',      day: 4, start: '11:00', end: '12:00', type: 'Theory',   f: 'MB' },
    { term: term3rd, code: 'MCA-305-ES',   day: 4, start: '13:00', end: '14:00', type: 'Elective', f: 'NV' },
    { term: term3rd, code: 'MCA-NBA',      day: 4, start: '14:00', end: '16:00', type: 'Activity', f: 'NBA' },

    // ==========================================
    // FRIDAY (Day 5)
    // ==========================================
    // Sem 1
    { term: term1st, code: 'MCA-BC-LAB-CDS', day: 5, start: '08:00', end: '10:00', type: 'Lab',           f: 'SB' },
    { term: term1st, code: 'MCA-101',        day: 5, start: '10:00', end: '11:00', type: 'Theory',        f: 'AM' },
    { term: term1st, code: 'MCA-102',        day: 5, start: '11:00', end: '12:00', type: 'Theory',        f: 'ABP' },
    { term: term1st, code: 'MCA-103',        day: 5, start: '13:00', end: '14:00', type: 'Theory',        f: 'BG' },
    { term: term1st, code: 'MCA-105',        day: 5, start: '14:00', end: '15:00', type: 'Theory',        f: 'SB' },
    { term: term1st, code: 'MCA-BC-IPDSC',   day: 5, start: '15:00', end: '16:00', type: 'Bridge Course', f: 'ABP' },
    // Sem 3
    { term: term3rd, code: 'MCA-306-MINI',   day: 5, start: '08:00', end: '10:00', type: 'Seminar',  f: 'MB' },
    { term: term3rd, code: 'MCA-303',        day: 5, start: '10:00', end: '11:00', type: 'Tutorial', f: 'BG' },
    { term: term3rd, code: 'MCA-302',        day: 5, start: '11:00', end: '12:00', type: 'Tutorial', f: 'NV' },
    { term: term3rd, code: 'MCA-301',        day: 5, start: '13:00', end: '14:00', type: 'Theory',   f: 'MB' },
    { term: term3rd, code: 'MCA-NBA',        day: 5, start: '14:00', end: '16:00', type: 'Activity', f: 'NBA' },

    // ==========================================
    // SATURDAY (Day 6)
    // ==========================================
    // Sem 1
    { term: term1st, code: 'MCA-BC-LAB-CDS', day: 6, start: '08:00', end: '10:00', type: 'Lab',           f: 'AM' },
    { term: term1st, code: 'MCA-BC-MFCS',    day: 6, start: '10:00', end: '11:00', type: 'Bridge Course', f: 'AB' },
    { term: term1st, code: 'MCA-104',        day: 6, start: '11:00', end: '12:00', type: 'Theory',        f: 'JPG' },
    // Sem 3
    { term: term3rd, code: 'MCA-306-MINI',   day: 6, start: '08:00', end: '12:00', type: 'Seminar',  f: 'NV' }
  ];

  for (const slot of timetableSlots) {
    const sec = sectionMap[slot.code];
    if (!sec) {
      console.warn(`Section missing for code ${slot.code}`);
      continue;
    }

    const firstFacultyCode = slot.f.split(',')[0].trim();
    const fProf = facultyMap[firstFacultyCode];

    await prisma.timetableEntry.create({
      data: {
        academicTermId: slot.term.id,
        sectionId: sec.id,
        classroomId: classroom.id,
        dayOfWeek: slot.day,
        startTime: slot.start,
        endTime: slot.end,
        subjectType: slot.type,
        facultyProfileId: fProf ? fProf.id : null,
        facultyInitials: slot.f
      }
    });
  }

  console.log(`🎉 Successfully seeded ${timetableSlots.length} timetable routine slots!`);
  console.log('🌟 Migration Complete: System is updated and universally ready for Assam Engineering College and beyond!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

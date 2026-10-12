import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AcademicService {
  constructor(private prisma: PrismaService) {}

  // --- Institutions ---
  async getAllInstitutions() {
    return (this.prisma as any).institution?.findMany({
      orderBy: { name: 'asc' }
    }) || [];
  }

  async createInstitution(data: {
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    allowedRadiusMeters?: number;
  }) {
    return (this.prisma as any).institution.create({
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || 'India',
        latitude: data.latitude !== undefined ? Number(data.latitude) : 26.140537,
        longitude: data.longitude !== undefined ? Number(data.longitude) : 91.656738,
        allowedRadiusMeters: data.allowedRadiusMeters !== undefined ? Number(data.allowedRadiusMeters) : 500,
      }
    });
  }

  async updateInstitution(id: string, data: any) {
    return (this.prisma as any).institution.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.code && { code: data.code.trim().toUpperCase() }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.latitude !== undefined && { latitude: Number(data.latitude) }),
        ...(data.longitude !== undefined && { longitude: Number(data.longitude) }),
        ...(data.allowedRadiusMeters !== undefined && { allowedRadiusMeters: Number(data.allowedRadiusMeters) }),
      }
    });
  }

  async deleteInstitution(id: string) {
    return (this.prisma as any).institution.delete({ where: { id } });
  }

  // --- Departments ---
  async createDepartment(data: { name: string; institution?: string; institutionId?: string }) {
    let institutionName = data.institution;
    if (data.institutionId && !institutionName) {
      const inst = await (this.prisma as any).institution?.findUnique({ where: { id: data.institutionId } });
      if (inst) institutionName = inst.name;
    }
    return this.prisma.department.create({
      data: {
        name: data.name.trim(),
        institution: institutionName || 'Assam Engineering College',
        institutionId: data.institutionId || null
      }
    });
  }

  async getAllDepartments() {
    return this.prisma.department.findMany({
      include: { subjects: true, classrooms: true },
      orderBy: { name: 'asc' }
    });
  }

  async updateDepartment(id: string, data: { name?: string; institution?: string; institutionId?: string }) {
    return this.prisma.department.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.institution && { institution: data.institution.trim() }),
        ...(data.institutionId !== undefined && { institutionId: data.institutionId })
      }
    });
  }

  async deleteDepartment(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }

  // --- Subjects ---
  async getSubjectsByDepartment(departmentId: string) {
    return this.prisma.subject.findMany({
      where: { departmentId },
      include: { sections: true },
      orderBy: [{ semester: 'asc' }, { code: 'asc' }]
    });
  }

  async getAllSubjects() {
    return this.prisma.subject.findMany({
      include: { department: true },
      orderBy: [{ semester: 'asc' }, { code: 'asc' }]
    });
  }

  // --- Sections (Classes) ---
  async createSection(data: { name: string; subjectId: string }) {
    return this.prisma.section.create({ data });
  }

  // --- Enrollments ---
  async enrollStudent(studentProfileId: string, sectionId: string) {
    return this.prisma.enrollment.create({
      data: { studentProfileId, sectionId }
    });
  }

  async getStudentEnrollments(studentProfileId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentProfileId },
      include: { section: { include: { subject: true } } }
    });
  }

  // --- Faculty Assignments ---
  async assignFacultyToSection(facultyProfileId: string, sectionId: string) {
    return this.prisma.classAssignment.create({
      data: { facultyProfileId, sectionId }
    });
  }

  async getFacultyTimetable(facultyProfileId: string) {
    return this.prisma.classAssignment.findMany({
      where: { facultyProfileId },
      include: { section: { include: { subject: true } } }
    });
  }

  // --- Terms ---
  async getAllTerms() {
    return this.prisma.academicTerm.findMany();
  }

  // --- Timetable ---
  async getTimetableRecords() {
    return this.prisma.timetableEntry.findMany({
      include: {
        academicTerm: true,
        section: { include: { subject: true } },
        classroom: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
  }

  async getSections() {
    return this.prisma.section.findMany({
      include: { subject: true }
    });
  }

  async getClassrooms() {
    return this.prisma.classroom.findMany({
      include: {
        department: true,
        esp32Device: true,
      },
      orderBy: { name: 'asc' }
    });
  }

  async updateClassroom(id: string, data: {
    name?: string;
    latitude?: number;
    longitude?: number;
    allowedRadiusMeters?: number;
    maxGpsAccuracy?: number;
    building?: string;
    floor?: string;
  }) {
    return this.prisma.classroom.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.latitude !== undefined && { latitude: Number(data.latitude) }),
        ...(data.longitude !== undefined && { longitude: Number(data.longitude) }),
        ...(data.allowedRadiusMeters !== undefined && { allowedRadiusMeters: Number(data.allowedRadiusMeters) }),
        ...(data.maxGpsAccuracy !== undefined && { maxGpsAccuracy: Number(data.maxGpsAccuracy) }),
        ...(data.building !== undefined && { building: data.building }),
        ...(data.floor !== undefined && { floor: data.floor }),
      }
    });
  }

  async createClassroom(data: {
    name: string;
    departmentId?: string;
    latitude?: number;
    longitude?: number;
    allowedRadiusMeters?: number;
    maxGpsAccuracy?: number;
    building?: string;
    floor?: string;
  }) {
    let deptId = data.departmentId;
    if (!deptId) {
      const firstDept = await this.prisma.department.findFirst();
      if (firstDept) {
        deptId = firstDept.id;
      } else {
        const newDept = await this.prisma.department.create({
          data: { name: 'General Engineering', institution: 'University Campus' }
        });
        deptId = newDept.id;
      }
    }

    return this.prisma.classroom.create({
      data: {
        name: data.name,
        departmentId: deptId,
        latitude: data.latitude !== undefined ? Number(data.latitude) : 26.140537,
        longitude: data.longitude !== undefined ? Number(data.longitude) : 91.656738,
        allowedRadiusMeters: data.allowedRadiusMeters !== undefined ? Number(data.allowedRadiusMeters) : 100,
        maxGpsAccuracy: data.maxGpsAccuracy !== undefined ? Number(data.maxGpsAccuracy) : 25,
        building: data.building || 'Main Campus Block',
        floor: data.floor || 'Ground',
      }
    });
  }

  async getRegistrationOptions() {
    const institutions = await this.prisma.institution.findMany({
      orderBy: { name: 'asc' }
    });
    const departments = await this.prisma.department.findMany({
      include: {
        subjects: {
          include: { sections: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return { institutions, departments };
  }

  // --- Deletions ---
  async deleteSubject(id: string) {
    // Delete related sections first
    const sections = await this.prisma.section.findMany({ where: { subjectId: id } });
    for (const sec of sections) {
      await this.prisma.timetableEntry.deleteMany({ where: { sectionId: sec.id } });
      await this.prisma.classAssignment.deleteMany({ where: { sectionId: sec.id } });
    }
    await this.prisma.section.deleteMany({ where: { subjectId: id } });
    return this.prisma.subject.delete({ where: { id } });
  }

  async deleteTerm(id: string) {
    await this.prisma.timetableEntry.deleteMany({ where: { academicTermId: id } });
    return this.prisma.academicTerm.delete({ where: { id } });
  }

  async deleteTimetableRecord(id: string) {
    return this.prisma.timetableEntry.delete({ where: { id } });
  }

  // --- Creations ---
  async createSubject(data: any) {
    let dept = data.departmentId 
      ? await this.prisma.department.findUnique({ where: { id: data.departmentId } })
      : await this.prisma.department.findFirst({ where: { name: { contains: 'Computer' } } }) || await this.prisma.department.findFirst();
    return this.prisma.subject.create({
      data: {
        code: data.code,
        name: data.name,
        syllabus: data.syllabus || null,
        semester: data.semester ? parseInt(data.semester, 10) : null,
        type: data.type || 'Theory',
        departmentId: dept!.id
      }
    });
  }

  async createTerm(data: any) {
    return this.prisma.academicTerm.create({
      data: {
        name: data.name,
        year: parseInt(data.year),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isCurrent: data.isCurrent === 'on' || data.isCurrent === true
      }
    });
  }

  async createTimetableRecord(data: any) {
    let facultyInitials = data.facultyInitials || null;
    let facultyProfileId = data.facultyProfileId || null;

    if (facultyProfileId && !facultyInitials) {
      const fac = await this.prisma.facultyProfile.findUnique({
        where: { id: facultyProfileId },
        include: { user: true }
      });
      if (fac) {
        facultyInitials = `${fac.user.firstName?.[0] || ''}${fac.user.lastName?.[0] || ''}`.toUpperCase();
      }
    }

    const entry = await this.prisma.timetableEntry.create({
      data: {
        academicTermId: data.academicTermId,
        sectionId: data.sectionId,
        classroomId: data.classroomId,
        dayOfWeek: parseInt(data.dayOfWeek, 10),
        startTime: data.startTime,
        endTime: data.endTime,
        subjectType: data.subjectType || 'Theory',
        facultyProfileId,
        facultyInitials
      }
    });

    if (facultyProfileId && data.sectionId) {
      const existing = await this.prisma.classAssignment.findFirst({
        where: { sectionId: data.sectionId, facultyProfileId }
      });
      if (!existing) {
        await this.prisma.classAssignment.create({
          data: { sectionId: data.sectionId, facultyProfileId }
        }).catch(() => {});
      }
    }

    return entry;
  }

  // --- Updates ---
  async updateSubject(id: string, data: any) {
    return this.prisma.subject.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.trim() }),
        ...(data.name && { name: data.name.trim() }),
        ...(data.syllabus !== undefined && { syllabus: data.syllabus }),
        ...(data.semester !== undefined && { semester: data.semester ? parseInt(data.semester, 10) : null }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.departmentId && { departmentId: data.departmentId })
      }
    });
  }

  async updateTerm(id: string, data: any) {
    return this.prisma.academicTerm.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.year && { year: parseInt(data.year, 10) }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.isCurrent !== undefined && { isCurrent: data.isCurrent === 'on' || data.isCurrent === true })
      }
    });
  }

  async updateTimetableRecord(id: string, data: any) {
    let facultyInitials = data.facultyInitials;
    if (data.facultyProfileId && !facultyInitials) {
      const fac = await this.prisma.facultyProfile.findUnique({
        where: { id: data.facultyProfileId },
        include: { user: true }
      });
      if (fac) {
        facultyInitials = `${fac.user.firstName?.[0] || ''}${fac.user.lastName?.[0] || ''}`.toUpperCase();
      }
    }

    const updated = await this.prisma.timetableEntry.update({
      where: { id },
      data: {
        ...(data.academicTermId && { academicTermId: data.academicTermId }),
        ...(data.sectionId && { sectionId: data.sectionId }),
        ...(data.classroomId && { classroomId: data.classroomId }),
        ...(data.dayOfWeek !== undefined && { dayOfWeek: parseInt(data.dayOfWeek, 10) }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.subjectType && { subjectType: data.subjectType }),
        ...(data.facultyProfileId !== undefined && { facultyProfileId: data.facultyProfileId || null }),
        ...(facultyInitials !== undefined && { facultyInitials })
      }
    });

    if (data.facultyProfileId && (data.sectionId || updated.sectionId)) {
      const secId = data.sectionId || updated.sectionId;
      const existing = await this.prisma.classAssignment.findFirst({
        where: { sectionId: secId, facultyProfileId: data.facultyProfileId }
      });
      if (!existing) {
        await this.prisma.classAssignment.create({
          data: { sectionId: secId, facultyProfileId: data.facultyProfileId }
        }).catch(() => {});
      }
    }

    return updated;
  }

  // --- Faculty & Course Assignment Management ---
  async getAllFaculty() {
    return this.prisma.facultyProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        assignedClasses: {
          include: {
            section: {
              include: {
                subject: true
              }
            }
          }
        }
      },
      orderBy: { employeeId: 'asc' }
    });
  }

  async getCourseAssignments() {
    return this.prisma.section.findMany({
      include: {
        subject: {
          include: { department: true }
        },
        classAssignments: {
          include: {
            faculty: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true }
                }
              }
            }
          }
        },
        timetableEntries: {
          include: {
            classroom: true,
            academicTerm: true
          }
        }
      },
      orderBy: [
        { subject: { semester: 'asc' } },
        { subject: { code: 'asc' } }
      ]
    });
  }

  async reassignCourseFaculty(sectionId: string, facultyProfileId: string) {
    const faculty = await this.prisma.facultyProfile.findUnique({
      where: { id: facultyProfileId },
      include: { user: true }
    });
    if (!faculty) {
      throw new Error('Faculty profile not found');
    }

    const initials = `${faculty.user.firstName?.[0] || ''}${faculty.user.lastName?.[0] || ''}`.toUpperCase();

    // Remove previous assignments for this section
    await this.prisma.classAssignment.deleteMany({
      where: { sectionId }
    });

    // Create new assignment
    const assignment = await this.prisma.classAssignment.create({
      data: {
        sectionId,
        facultyProfileId
      }
    });

    // Update all associated timetable entries
    await this.prisma.timetableEntry.updateMany({
      where: { sectionId },
      data: {
        facultyProfileId,
        facultyInitials: initials
      }
    });

    return {
      success: true,
      message: `Course assigned to ${faculty.user.firstName} ${faculty.user.lastName} (${initials})`,
      assignment
    };
  }

  async transferAllCourses(fromFacultyProfileId: string, toFacultyProfileId: string) {
    const [fromFaculty, toFaculty] = await Promise.all([
      this.prisma.facultyProfile.findUnique({
        where: { id: fromFacultyProfileId },
        include: { user: true }
      }),
      this.prisma.facultyProfile.findUnique({
        where: { id: toFacultyProfileId },
        include: { user: true }
      })
    ]);

    if (!fromFaculty || !toFaculty) {
      throw new Error('One or both faculty profiles not found');
    }

    const toInitials = `${toFaculty.user.firstName?.[0] || ''}${toFaculty.user.lastName?.[0] || ''}`.toUpperCase();

    const assignments = await this.prisma.classAssignment.findMany({
      where: { facultyProfileId: fromFacultyProfileId }
    });

    const transferredSectionIds = assignments.map(a => a.sectionId);

    for (const sectionId of transferredSectionIds) {
      await this.prisma.classAssignment.deleteMany({ where: { sectionId } });
      await this.prisma.classAssignment.create({
        data: { sectionId, facultyProfileId: toFacultyProfileId }
      });
      await this.prisma.timetableEntry.updateMany({
        where: { sectionId },
        data: {
          facultyProfileId: toFacultyProfileId,
          facultyInitials: toInitials
        }
      });
    }

    // Also update any timetable entries directly referencing fromFacultyProfileId
    await this.prisma.timetableEntry.updateMany({
      where: { facultyProfileId: fromFacultyProfileId },
      data: {
        facultyProfileId: toFacultyProfileId,
        facultyInitials: toInitials
      }
    });

    return {
      success: true,
      transferredCount: transferredSectionIds.length,
      message: `Successfully transferred ${transferredSectionIds.length} course(s) from ${fromFaculty.user.firstName} ${fromFaculty.user.lastName} to ${toFaculty.user.firstName} ${toFaculty.user.lastName} (${toInitials})`
    };
  }

  // --- Universal Multi-Tenant Institution ---
  async getInstitution() {
    const inst = await (this.prisma as any).institution?.findFirst() || {
      id: 'inst-aec-guwahati',
      name: 'Assam Engineering College',
      code: 'AEC',
      address: 'Jalukbari, Guwahati, Assam 781013',
      city: 'Guwahati',
      state: 'Assam',
      country: 'India',
      latitude: 26.140537,
      longitude: 91.656738,
      allowedRadiusMeters: 500
    };
    const departments = await this.prisma.department.findMany({
      include: {
        subjects: true,
        classrooms: true
      }
    });
    return { institution: inst, departments };
  }
}


import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AcademicService {
  constructor(private prisma: PrismaService) {}

  // --- Departments ---
  async createDepartment(data: { name: string; institution: string }) {
    return this.prisma.department.create({ data });
  }

  async getAllDepartments() {
    return this.prisma.department.findMany({
      include: { subjects: true, classrooms: true }
    });
  }

  // --- Subjects ---
  async getSubjectsByDepartment(departmentId: string) {
    return this.prisma.subject.findMany({
      where: { departmentId },
      include: { sections: true }
    });
  }

  async getAllSubjects() {
    return this.prisma.subject.findMany({
      include: { department: true }
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
      }
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
    const departments = await this.prisma.department.findMany({
      include: {
        subjects: {
          include: { sections: true }
        }
      }
    });
    return { departments };
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
    const dept = await this.prisma.department.findFirst({ where: { name: 'Computer Applications' } });
    return this.prisma.subject.create({
      data: {
        code: data.code,
        name: data.name,
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
    // Assuming simple mapping for now
    return this.prisma.timetableEntry.create({
      data: {
        academicTermId: data.academicTermId,
        sectionId: data.sectionId,
        classroomId: data.classroomId,
        dayOfWeek: parseInt(data.dayOfWeek),
        startTime: data.startTime,
        endTime: data.endTime,
        subjectType: data.subjectType
      }
    });
  }

  // --- Updates ---
  async updateSubject(id: string, data: any) {
    return this.prisma.subject.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.trim() }),
        ...(data.name && { name: data.name.trim() }),
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
    return this.prisma.timetableEntry.update({
      where: { id },
      data: {
        ...(data.academicTermId && { academicTermId: data.academicTermId }),
        ...(data.sectionId && { sectionId: data.sectionId }),
        ...(data.classroomId && { classroomId: data.classroomId }),
        ...(data.dayOfWeek !== undefined && { dayOfWeek: parseInt(data.dayOfWeek, 10) }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.subjectType && { subjectType: data.subjectType })
      }
    });
  }
}

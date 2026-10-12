import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        studentProfile: {
          select: {
            id: true,
            enrollmentNo: true,
            semester: true,
            status: true,
            departmentId: true,
            faceProfile: {
              select: { id: true, imageUrl: true }
            }
          }
        },
        facultyProfile: {
          select: {
            id: true,
            employeeId: true,
            departmentId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        studentProfile: {
          select: {
            id: true,
            enrollmentNo: true,
            semester: true,
            status: true,
            departmentId: true,
            faceProfile: {
              select: { id: true, imageUrl: true }
            }
          }
        },
        facultyProfile: {
          select: {
            id: true,
            employeeId: true,
            departmentId: true
          }
        }
      }
    });
    return user;
  }

  async deleteUser(id: string) {
    // Delete associated profiles first
    await this.prisma.studentProfile.deleteMany({ where: { userId: id } });
    await this.prisma.facultyProfile.deleteMany({ where: { userId: id } });
    await this.prisma.adminProfile.deleteMany({ where: { userId: id } });

    return this.prisma.user.delete({
      where: { id }
    });
  }

  async updateUser(id: string, data: any) {
    const { firstName, lastName, email, phone, role, password, enrollmentNo, semester, status, employeeId, departmentId } = data;
    
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (role !== undefined) updateData.role = role;

    if (password && password.trim()) {
      const bcrypt = await import('bcrypt');
      updateData.password = await bcrypt.hash(password.trim(), 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        studentProfile: true,
        facultyProfile: true
      }
    });

    // Update or create Student Profile
    if (role === 'STUDENT' || updatedUser.studentProfile) {
      const semNum = semester !== undefined ? parseInt(semester, 10) : undefined;
      if (updatedUser.studentProfile) {
        await this.prisma.studentProfile.update({
          where: { id: updatedUser.studentProfile.id },
          data: {
            ...(enrollmentNo && { enrollmentNo: enrollmentNo.trim() }),
            ...(semNum !== undefined && !isNaN(semNum) && { semester: semNum }),
            ...(status && { status }),
            ...(departmentId && { departmentId })
          }
        });
      } else if (enrollmentNo) {
        await this.prisma.studentProfile.create({
          data: {
            userId: id,
            enrollmentNo: enrollmentNo.trim(),
            semester: semNum || 1,
            status: status || 'ACTIVE',
            departmentId: departmentId || null
          }
        });
      }
    }

    // Update or create Faculty Profile
    if (role === 'FACULTY' || updatedUser.facultyProfile) {
      if (updatedUser.facultyProfile) {
        await this.prisma.facultyProfile.update({
          where: { id: updatedUser.facultyProfile.id },
          data: {
            ...(employeeId && { employeeId: employeeId.trim() }),
            ...(departmentId && { departmentId })
          }
        });
      } else if (employeeId) {
        await this.prisma.facultyProfile.create({
          data: {
            userId: id,
            employeeId: employeeId.trim(),
            departmentId: departmentId || null
          }
        });
      }
    }

    return this.getMe(id);
  }

  async promoteStudents(options: { mode?: string; fromSemester?: number; toSemester?: number }) {
    const { mode = 'ALL', fromSemester, toSemester } = options;

    if (mode === 'SPECIFIC') {
      const from = parseInt(fromSemester as any, 10);
      const to = parseInt(toSemester as any, 10);

      if (isNaN(from) || isNaN(to)) {
        throw new Error('Valid fromSemester and toSemester are required for specific promotion');
      }

      const students = await this.prisma.studentProfile.findMany({
        where: { semester: from, status: 'ACTIVE' }
      });

      const isGraduation = to > 6;
      for (const st of students) {
        await this.prisma.studentProfile.update({
          where: { id: st.id },
          data: {
            semester: isGraduation ? 6 : to,
            status: isGraduation ? 'GRADUATED' : 'ACTIVE'
          }
        });
      }

      if (!isGraduation) {
        await this.enrollStudentsIntoSemester(students.map(s => s.id), to);
      }

      await this.prisma.auditLog.create({
        data: {
          action: 'SEMESTER_PROMOTION_SPECIFIC',
          details: `Promoted ${students.length} students from Semester ${from} to Semester ${to} (${isGraduation ? 'Graduated' : 'Active'})`
        }
      });

      return {
        success: true,
        count: students.length,
        message: `Successfully advanced ${students.length} students from Semester ${from} to Semester ${to}`
      };
    }

    // Bulk Annual / Semester Transition across ALL semesters
    // 6th -> Graduated
    // 5th -> 6th
    // 4th -> 5th
    // 3rd -> 4th
    // 2nd -> 3rd
    // 1st -> 2nd
    let totalPromoted = 0;
    const summary: Record<string, number> = {};

    for (let sem = 6; sem >= 1; sem--) {
      const cohort = await this.prisma.studentProfile.findMany({
        where: { semester: sem, status: 'ACTIVE' }
      });

      for (const st of cohort) {
        if (sem === 6) {
          await this.prisma.studentProfile.update({
            where: { id: st.id },
            data: { status: 'GRADUATED' }
          });
        } else {
          await this.prisma.studentProfile.update({
            where: { id: st.id },
            data: { semester: sem + 1 }
          });
        }
      }

      if (sem < 6) {
        await this.enrollStudentsIntoSemester(cohort.map(s => s.id), sem + 1);
      }

      summary[`Sem_${sem}_to_${sem === 6 ? 'Graduated' : sem + 1}`] = cohort.length;
      totalPromoted += cohort.length;
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'SEMESTER_PROMOTION_BULK',
        details: `Bulk semester advancement completed for ${totalPromoted} active students: ${JSON.stringify(summary)}`
      }
    });

    return {
      success: true,
      count: totalPromoted,
      summary,
      message: `Bulk semester rollover completed successfully for ${totalPromoted} students.`
    };
  }

  private async enrollStudentsIntoSemester(studentIds: string[], semester: number) {
    if (!studentIds.length || semester > 6) return;
    const sections = await this.prisma.section.findMany({
      where: { subject: { semester } }
    });
    for (const stId of studentIds) {
      for (const sec of sections) {
        const existing = await this.prisma.enrollment.findFirst({
          where: { studentProfileId: stId, sectionId: sec.id }
        });
        if (!existing) {
          await this.prisma.enrollment.create({
            data: { studentProfileId: stId, sectionId: sec.id }
          }).catch(() => {});
        }
      }
    }
  }

  async updateFacePhoto(userId: string, base64Photo: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { faceProfile: true }
    });

    if (!student) {
      throw new Error('Student profile not found for this user account');
    }

    // Generate lightweight spatial hash template
    const cleanBase64 = base64Photo.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const hashVector = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      let sum = 0;
      for (let j = i; j < buffer.length; j += 512) {
        sum += buffer[j];
      }
      hashVector[i] = (sum % 256) / 128.0 - 1.0;
    }
    const faceTemplate = JSON.stringify(Array.from(hashVector));

    if (student.faceProfile) {
      await this.prisma.faceProfile.update({
        where: { id: student.faceProfile.id },
        data: {
          imageUrl: base64Photo,
          faceTemplate
        }
      });
    } else {
      await this.prisma.faceProfile.create({
        data: {
          studentProfileId: student.id,
          imageUrl: base64Photo,
          faceTemplate
        }
      });
    }

    return { success: true, message: 'Biometric face photo updated successfully' };
  }

  async createUser(data: any) {
    const { email, firstName, lastName, role, password, enrollmentNo, employeeId } = data;
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password || 'Aec@123', 10);
    
    const user = await this.prisma.user.create({
      data: { email, firstName, lastName, role, password: hashedPassword }
    });

    if (role === 'STUDENT' && enrollmentNo) {
      await this.prisma.studentProfile.create({
        data: { userId: user.id, enrollmentNo, semester: parseInt(data.semester) || 1 }
      });
    } else if (role === 'FACULTY' && employeeId) {
      const dept = await this.prisma.department.findFirst({ where: { name: 'Computer Applications' } });
      if (dept) {
        await this.prisma.facultyProfile.create({
          data: { userId: user.id, employeeId, departmentId: dept.id }
        });
      }
    }
    
    return user;
  }
}

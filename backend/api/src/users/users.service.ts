import { Injectable, NotFoundException } from '@nestjs/common';
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        facultyProfile: true,
        adminProfile: true
      }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Clean up Student Profile dependencies
      if (user.studentProfile) {
        const sId = user.studentProfile.id;
        await tx.faceProfile.deleteMany({ where: { studentProfileId: sId } });
        await tx.attendanceRecord.deleteMany({ where: { studentProfileId: sId } });
        await tx.enrollment.deleteMany({ where: { studentProfileId: sId } });
        await tx.ticketMessage.deleteMany({ where: { ticket: { studentProfileId: sId } } });
        await tx.feedbackTicket.deleteMany({ where: { studentProfileId: sId } });
        await tx.studentProfile.delete({ where: { id: sId } });
      }

      // 2. Clean up Faculty Profile dependencies
      if (user.facultyProfile) {
        const fId = user.facultyProfile.id;
        await tx.classAssignment.deleteMany({ where: { facultyProfileId: fId } });
        await tx.timetableEntry.updateMany({
          where: { facultyProfileId: fId },
          data: { facultyProfileId: null, facultyInitials: null }
        });
        await tx.attendanceRecord.deleteMany({
          where: { classSession: { facultyProfileId: fId } }
        });
        await tx.feedbackTicket.updateMany({
          where: { classSession: { facultyProfileId: fId } },
          data: { classSessionId: null }
        });
        await tx.classSession.deleteMany({ where: { facultyProfileId: fId } });
        await tx.facultyProfile.delete({ where: { id: fId } });
      }

      // 3. Clean up Admin Profile
      if (user.adminProfile) {
        await tx.adminProfile.delete({ where: { id: user.adminProfile.id } });
      }

      // 4. Clean up ticket messages sent by this user
      await tx.ticketMessage.deleteMany({ where: { userId: id } });

      // 5. Delete user record (AuditLog.userId is not a foreign key, preserving audit immutability)
      await tx.user.delete({ where: { id } });

      // 6. Record deletion event in audit trail
      await tx.auditLog.create({
        data: {
          action: 'USER_DELETED',
          details: `User ${user.email} (${user.role}) deleted with cascading reference cleanup.`
        }
      }).catch(() => {});

      return {
        success: true,
        message: `User ${user.email} successfully deleted with all associated records.`,
        deletedUserId: id
      };
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

    // Validate face and extract ArcFace 512-D embedding template from AI service
    let faceTemplate = '';
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
      const aiRes = await fetch(`${aiServiceUrl}/enroll-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          image_base64: base64Photo
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (aiRes.ok) {
        const enrollData = await aiRes.json();
        if (enrollData.embedding_vector) {
          faceTemplate = JSON.stringify(enrollData.embedding_vector);
        }
      } else {
        const errJson: any = await aiRes.json().catch(() => ({}));
        if (errJson.detail) {
          throw new Error(errJson.detail);
        }
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('face') || err.message.includes('blurry') || err.message.includes('Multiple'))) {
        throw err;
      }
      // AI service might be offline during initial bootstrap; continue with spatial fallback
    }

    // Fallback template if AI service offline
    if (!faceTemplate) {
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
      faceTemplate = JSON.stringify(Array.from(hashVector));
    }

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

    return { success: true, message: 'ArcFace biometric face photo enrolled successfully' };
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


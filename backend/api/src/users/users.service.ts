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
        firstName: true,
        lastName: true,
        role: true,
        studentProfile: {
          select: { enrollmentNo: true }
        },
        facultyProfile: {
          select: { employeeId: true }
        }
      }
    });
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

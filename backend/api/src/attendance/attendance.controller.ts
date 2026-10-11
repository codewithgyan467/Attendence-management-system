import { Controller, Get, Post, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private prisma: PrismaService
  ) {}

  @Roles('FACULTY')
  @Get('faculty/timetable')
  async getFacultyTimetable(@Request() req: any) {
    const faculty = await this.prisma.facultyProfile.findUnique({ where: { userId: req.user.userId } });
    if (!faculty) throw new BadRequestException('Faculty profile not found');
    return this.attendanceService.getFacultyTimetable(faculty.id);
  }

  @Roles('FACULTY')
  @Get('session/:id/attendance')
  async getSessionAttendance(@Param('id') sessionId: string, @Request() req: any) {
    const faculty = await this.prisma.facultyProfile.findUnique({ where: { userId: req.user.userId } });
    if (!faculty) throw new BadRequestException('Faculty profile not found');
    return this.attendanceService.getSessionAttendance(sessionId, faculty.id);
  }

  @Roles('FACULTY')
  @Post('session/start')
  async startSession(@Request() req: any, @Body('classroomId') classroomId: string, @Body('timetableEntryId') timetableEntryId?: string) {
    const faculty = await this.prisma.facultyProfile.findUnique({ where: { userId: req.user.userId } });
    if (!faculty) throw new BadRequestException('Faculty profile not found');
    return this.attendanceService.startSession(faculty.id, classroomId, timetableEntryId);
  }

  @Roles('FACULTY')
  @Post('session/:id/end')
  async endSession(@Param('id') sessionId: string, @Request() req: any) {
    const faculty = await this.prisma.facultyProfile.findUnique({ where: { userId: req.user.userId } });
    if (!faculty) throw new BadRequestException('Faculty profile not found');
    return this.attendanceService.endSession(sessionId, faculty.id);
  }

  @Roles('STUDENT')
  @Get('sessions/active')
  async getActiveSessions(@Request() req: any) {
    const student = await this.prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
    if (!student) throw new BadRequestException('Student profile not found');
    return this.attendanceService.getActiveSessionsForStudent(student.id);
  }

  @Roles('STUDENT')
  @Post('mark')
  async markAttendance(@Request() req: any, @Body() body: any) {
    const student = await this.prisma.studentProfile.findUnique({ where: { userId: req.user.userId } });
    if (!student) throw new BadRequestException('Student profile not found');
    return this.attendanceService.markAttendance({
      ...body,
      studentProfileId: student.id
    });
  }
}

import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
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

  // --- Live Calendar, Clock & Timetable Session Endpoint ---
  @Get('live-schedule')
  async getLiveSchedule(
    @Request() req: any,
    @Query('simulateDay') simulateDay?: string,
    @Query('simulateTime') simulateTime?: string,
    @Query('semester') semester?: string
  ) {
    let targetSemester = semester ? Number(semester) : undefined;
    if (!targetSemester && req.user?.userId) {
      const student = await this.prisma.studentProfile.findUnique({
        where: { userId: req.user.userId }
      });
      if (student) {
        targetSemester = student.semester;
      }
    }

    return this.attendanceService.getLiveScheduleSession({
      simulateDay: simulateDay !== undefined ? Number(simulateDay) : undefined,
      simulateTime,
      semester: targetSemester
    });
  }

  @Get('clock')
  async getClock() {
    return this.attendanceService.getLiveClockData();
  }

  // --- Faculty Actions ---
  @Roles('FACULTY')
  @Get('faculty/timetable')
  async getFacultyTimetable(@Request() req: any) {
    const faculty = await this.prisma.facultyProfile.findUnique({ where: { userId: req.user.userId } });
    if (!faculty) throw new BadRequestException('Faculty profile not found');
    return this.attendanceService.getFacultyTimetable(faculty.id);
  }

  @Roles('FACULTY', 'ADMIN')
  @Get('session/:id/attendance')
  async getSessionAttendance(@Param('id') sessionId: string, @Request() req: any) {
    return this.attendanceService.getSessionAttendance(sessionId);
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

  // --- Student Actions ---
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

  // --- Admin Master Actions ---
  @Roles('ADMIN')
  @Get('admin/records')
  async getAllRecords(
    @Query('date') date?: string,
    @Query('status') status?: string
  ) {
    return this.attendanceService.getAllRecords({ date, status });
  }

  @Roles('ADMIN')
  @Post('admin/override')
  async adminOverrideRecord(@Request() req: any, @Body() body: any) {
    return this.attendanceService.adminOverrideRecord({
      ...body,
      adminUserId: req.user.userId
    });
  }

  @Roles('ADMIN')
  @Get('admin/holidays')
  async getHolidays() {
    return this.attendanceService.getHolidays();
  }

  @Roles('ADMIN')
  @Post('admin/holidays')
  async addHoliday(@Body() body: { title: string; date: string; description?: string }) {
    if (!body.title || !body.date) throw new BadRequestException('Title and date required');
    return this.attendanceService.addHoliday(body);
  }

  @Roles('ADMIN')
  @Delete('admin/holidays/:id')
  async deleteHoliday(@Param('id') id: string) {
    return this.attendanceService.deleteHoliday(id);
  }

  // --- ESP32 Hardware & Offline Synchronization ---
  @Post('hardware/beacon-challenge')
  async getBeaconChallenge(@Body('deviceId') deviceId: string) {
    if (!deviceId) throw new BadRequestException('deviceId is required');
    return this.attendanceService.generateBeaconChallenge(deviceId);
  }

  @Post('sync-offline-batch')
  async syncOfflineBatch(@Body() body: { events: Array<any> }) {
    if (!body || !body.events) throw new BadRequestException('events array is required');
    return this.attendanceService.syncOfflineBatch(body.events);
  }

  @Post('demo/start-live-session')
  async startLiveDemoSession(@Body('studentProfileId') studentProfileId?: string) {
    return this.attendanceService.startOrGetLiveDemoSession(studentProfileId);
  }
}

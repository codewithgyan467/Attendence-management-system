import { Controller, Get, Put, Param, Query, Body, UseGuards, Request, Response } from '@nestjs/common';
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Roles('ADMIN')
  @Get('global')
  getGlobalStats() {
    return this.reportsService.getGlobalAttendanceStats();
  }

  @Roles('ADMIN')
  @Get('department/:id')
  getDepartmentStats(@Param('id') departmentId: string) {
    return this.reportsService.getDepartmentStats(departmentId);
  }

  @Roles('STUDENT', 'FACULTY', 'ADMIN')
  @Get('student/:id')
  getStudentReport(@Request() req: any, @Param('id') studentProfileId: string) {
    return this.reportsService.getStudentReport(studentProfileId);
  }

  // --- Attendance Policy (NC & DC Thresholds) ---
  @Roles('FACULTY', 'ADMIN', 'STUDENT')
  @Get('policy')
  getAttendancePolicy() {
    return this.reportsService.getAttendancePolicy();
  }

  @Roles('ADMIN')
  @Put('policy')
  updateAttendancePolicy(
    @Request() req: any,
    @Body() body: { ncThreshold: number; dcThreshold: number }
  ) {
    return this.reportsService.updateAttendancePolicy(body, req.user?.userId);
  }

  // --- Class Sections Selector ---
  @Roles('FACULTY', 'ADMIN')
  @Get('sections')
  getSections(@Request() req: any) {
    return this.reportsService.getAvailableSections({
      userId: req.user.userId,
      role: req.user.role
    });
  }

  // --- Attendance Register Matrix (Daily / Weekly / Monthly / Subject) ---
  @Roles('FACULTY', 'ADMIN')
  @Get('register')
  getAttendanceRegister(
    @Request() req: any,
    @Query('sectionId') sectionId?: string,
    @Query('timeframe') timeframe?: 'daily' | 'weekly' | 'monthly' | 'all',
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('statusFilter') statusFilter?: string
  ) {
    return this.reportsService.getAttendanceRegister({
      sectionId,
      timeframe,
      date,
      month,
      statusFilter,
      user: {
        userId: req.user.userId,
        role: req.user.role
      }
    });
  }

  // --- Admin Daily Master Report Across Institution ---
  @Roles('ADMIN')
  @Get('daily-master')
  getDailyMasterReport(@Query('date') date?: string) {
    return this.reportsService.getDailyInstitutionReport(date);
  }

  @Roles('FACULTY', 'ADMIN')
  @Get('session/:id/export-csv')
  async exportSessionCsv(@Param('id') sessionId: string, @Response() res: any) {
    const csvContent = await this.reportsService.exportSessionAttendanceCsv(sessionId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-session-${sessionId}.csv"`);
    return res.send(csvContent);
  }
}


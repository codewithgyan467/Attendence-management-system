import { Controller, Get, Param, UseGuards, Request, Response } from '@nestjs/common';
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

  @Roles('FACULTY', 'ADMIN')
  @Get('session/:id/export-csv')
  async exportSessionCsv(@Param('id') sessionId: string, @Response() res: any) {
    const csvContent = await this.reportsService.exportSessionAttendanceCsv(sessionId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-session-${sessionId}.csv"`);
    return res.send(csvContent);
  }
}

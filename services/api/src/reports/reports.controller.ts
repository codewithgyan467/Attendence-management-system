import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
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
    // In a real app, verify that the requester is the student themselves, or an admin/faculty
    return this.reportsService.getStudentReport(studentProfileId);
  }
}

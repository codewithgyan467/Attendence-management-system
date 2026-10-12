import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AcademicService } from './academic.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic')
export class AcademicController {
  constructor(private academicService: AcademicService) {}

  // --- Institutions ---
  @Get('institutions')
  getAllInstitutions() {
    return this.academicService.getAllInstitutions();
  }

  @Roles('ADMIN')
  @Post('institutions')
  createInstitution(@Body() body: any) {
    return this.academicService.createInstitution(body);
  }

  @Roles('ADMIN')
  @Put('institutions/:id')
  updateInstitution(@Param('id') id: string, @Body() body: any) {
    return this.academicService.updateInstitution(id, body);
  }

  @Roles('ADMIN')
  @Delete('institutions/:id')
  deleteInstitution(@Param('id') id: string) {
    return this.academicService.deleteInstitution(id);
  }

  // --- Departments ---
  @Roles('ADMIN')
  @Post('departments')
  createDepartment(@Body() body: { name: string; institution?: string; institutionId?: string }) {
    return this.academicService.createDepartment(body);
  }

  @Get('departments')
  getAllDepartments() {
    return this.academicService.getAllDepartments();
  }

  @Roles('ADMIN')
  @Put('departments/:id')
  updateDepartment(@Param('id') id: string, @Body() body: any) {
    return this.academicService.updateDepartment(id, body);
  }

  @Roles('ADMIN')
  @Delete('departments/:id')
  deleteDepartment(@Param('id') id: string) {
    return this.academicService.deleteDepartment(id);
  }

  @Get('institution')
  getInstitution() {
    return this.academicService.getInstitution();
  }

  @Get('departments/:id/subjects')
  getSubjectsByDepartment(@Param('id') id: string) {
    return this.academicService.getSubjectsByDepartment(id);
  }

  @Get('subjects')
  getAllSubjects() {
    return this.academicService.getAllSubjects();
  }

  @Get('terms')
  getAllTerms() {
    return this.academicService.getAllTerms();
  }

  @Get('timetable')
  getTimetableRecords() {
    return this.academicService.getTimetableRecords();
  }

  @Get('sections')
  getSections() {
    return this.academicService.getSections();
  }

  @Get('classrooms')
  getClassrooms() {
    return this.academicService.getClassrooms();
  }

  @Roles('ADMIN')
  @Put('classrooms/:id')
  updateClassroom(@Param('id') id: string, @Body() body: any) {
    return this.academicService.updateClassroom(id, body);
  }

  @Roles('ADMIN')
  @Post('classrooms')
  createClassroom(@Body() body: any) {
    return this.academicService.createClassroom(body);
  }

  @Roles('ADMIN')
  @Put('subjects/:id')
  updateSubject(@Param('id') id: string, @Body() body: any) {
    return this.academicService.updateSubject(id, body);
  }

  @Roles('ADMIN')
  @Put('terms/:id')
  updateTerm(@Param('id') id: string, @Body() body: any) {
    return this.academicService.updateTerm(id, body);
  }

  @Roles('ADMIN')
  @Put('timetable/:id')
  updateTimetableRecord(@Param('id') id: string, @Body() body: any) {
    return this.academicService.updateTimetableRecord(id, body);
  }

  @Roles('ADMIN')
  @Delete('subjects/:id')
  deleteSubject(@Param('id') id: string) {
    return this.academicService.deleteSubject(id);
  }

  @Roles('ADMIN')
  @Delete('terms/:id')
  deleteTerm(@Param('id') id: string) {
    return this.academicService.deleteTerm(id);
  }

  @Roles('ADMIN')
  @Delete('timetable/:id')
  deleteTimetableRecord(@Param('id') id: string) {
    return this.academicService.deleteTimetableRecord(id);
  }

  @Roles('ADMIN')
  @Post('subjects')
  createSubject(@Body() body: any) {
    return this.academicService.createSubject(body);
  }

  @Roles('ADMIN')
  @Post('terms')
  createTerm(@Body() body: any) {
    return this.academicService.createTerm(body);
  }

  @Roles('ADMIN')
  @Post('timetable')
  createTimetableRecord(@Body() body: any) {
    return this.academicService.createTimetableRecord(body);
  }

  @Roles('ADMIN')
  @Post('sections')
  createSection(@Body() body: { name: string; subjectId: string }) {
    return this.academicService.createSection(body);
  }

  @Roles('ADMIN')
  @Post('enrollments')
  enrollStudent(@Body() body: { studentProfileId: string; sectionId: string }) {
    return this.academicService.enrollStudent(body.studentProfileId, body.sectionId);
  }

  @Roles('ADMIN')
  @Post('assignments')
  assignFaculty(@Body() body: { facultyProfileId: string; sectionId: string }) {
    return this.academicService.assignFacultyToSection(body.facultyProfileId, body.sectionId);
  }

  @Get('faculty')
  getAllFaculty() {
    return this.academicService.getAllFaculty();
  }

  @Get('course-assignments')
  getCourseAssignments() {
    return this.academicService.getCourseAssignments();
  }

  @Roles('ADMIN')
  @Post('reassign-course')
  reassignCourse(@Body() body: { sectionId: string; facultyProfileId: string }) {
    return this.academicService.reassignCourseFaculty(body.sectionId, body.facultyProfileId);
  }

  @Roles('ADMIN')
  @Post('transfer-faculty-courses')
  transferFacultyCourses(@Body() body: { fromFacultyProfileId: string; toFacultyProfileId: string }) {
    return this.academicService.transferAllCourses(body.fromFacultyProfileId, body.toFacultyProfileId);
  }
}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { AcademicModule } from './academic/academic.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { FeedbackModule } from './feedback/feedback.module.js';
import { ReportsModule } from './reports/reports.module.js';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, AcademicModule, AttendanceModule, FeedbackModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

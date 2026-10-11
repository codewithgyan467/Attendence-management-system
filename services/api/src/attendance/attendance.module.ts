import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';
import { AttendanceController } from './attendance.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [AttendanceService],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}

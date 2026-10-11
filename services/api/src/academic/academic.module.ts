import { Module } from '@nestjs/common';
import { AcademicService } from './academic.service.js';
import { AcademicController } from './academic.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [AcademicService],
  controllers: [AcademicController],
  exports: [AcademicService],
})
export class AcademicModule {}

import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service.js';
import { FeedbackController } from './feedback.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [FeedbackService],
  controllers: [FeedbackController],
  exports: [FeedbackService],
})
export class FeedbackModule {}

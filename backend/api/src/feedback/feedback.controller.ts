import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Query } from '@nestjs/common';
import { FeedbackService } from './feedback.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  @Post()
  createTicket(@Request() req: any, @Body() body: any) {
    const userId = req.user.userId;
    return this.feedbackService.createTicket({ ...body, userId });
  }

  @Get('my-tickets')
  getMyTickets(@Request() req: any) {
    const userId = req.user.userId;
    return this.feedbackService.getTicketsByUser(userId);
  }

  @Roles('ADMIN')
  @Get('admin/tickets')
  getAllTickets(@Query('status') status: string) {
    return this.feedbackService.getAllTickets(status);
  }

  @Roles('ADMIN')
  @Patch('admin/tickets/:id/status')
  updateStatus(@Request() req: any, @Param('id') ticketId: string, @Body('status') status: string) {
    const adminId = req.user.userId;
    return this.feedbackService.updateTicketStatus(ticketId, status, adminId);
  }

  @Post(':id/reply')
  addReply(@Request() req: any, @Param('id') ticketId: string, @Body('message') message: string) {
    const userId = req.user.userId;
    return this.feedbackService.addReply(ticketId, userId, message);
  }
}

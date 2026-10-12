import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async createTicket(data: {
    userId: string;
    subject?: string;
    description: string;
    category?: string;
    classSessionId?: string;
  }) {
    if (!data.description || !data.description.trim()) {
      throw new BadRequestException('Ticket description is required');
    }

    let student = await this.prisma.studentProfile.findUnique({
      where: { userId: data.userId }
    });

    if (!student) {
      const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
      if (!user) throw new NotFoundException('User not found');
      student = await this.prisma.studentProfile.create({
        data: {
          userId: data.userId,
          enrollmentNo: user.email.split('@')[0],
          semester: 1,
        }
      });
    }

    const fullDescription = data.subject && data.subject.trim()
      ? `[${data.subject.trim()}] ${data.description.trim()}`
      : data.description.trim();

    return this.prisma.feedbackTicket.create({
      data: {
        studentProfileId: student.id,
        category: data.category || 'ATTENDANCE_DISPUTE',
        description: fullDescription,
        classSessionId: data.classSessionId || null,
        status: 'OPEN',
      },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, role: true } }
          }
        },
        messages: true,
      }
    });
  }

  async getTicketsByUser(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId }
    });
    if (!student) return [];

    return this.prisma.feedbackTicket.findMany({
      where: { studentProfileId: student.id },
      include: {
        messages: {
          include: {
            user: { select: { firstName: true, lastName: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        classSession: {
          include: {
            classroom: true,
            timetableEntry: {
              include: {
                section: { include: { subject: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllTickets(status?: string) {
    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    return this.prisma.feedbackTicket.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } }
          }
        },
        messages: {
          include: {
            user: { select: { firstName: true, lastName: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        classSession: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateTicketStatus(ticketId: string, status: string, adminId: string) {
    const validStatuses = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid ticket status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const ticket = await this.prisma.feedbackTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Feedback ticket not found');

    const updated = await this.prisma.feedbackTicket.update({
      where: { id: ticketId },
      data: { status },
      include: {
        student: { include: { user: true } },
        messages: true
      }
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'FEEDBACK_TICKET_STATUS_UPDATED',
        details: JSON.stringify({ ticketId, previousStatus: ticket.status, newStatus: status })
      }
    }).catch(() => {});

    return updated;
  }

  async addReply(ticketId: string, userId: string, message: string) {
    if (!message || !message.trim()) {
      throw new BadRequestException('Message cannot be empty');
    }

    const ticket = await this.prisma.feedbackTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Feedback ticket not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const ticketMessage = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        userId,
        message: message.trim(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } }
      }
    });

    await this.prisma.feedbackTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    });

    return ticketMessage;
  }
}


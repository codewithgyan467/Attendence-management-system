import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeedbackService } from './feedback.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('FeedbackService (Grievance & Discrepancy Ticket Lifecycle)', () => {
  let service: FeedbackService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      studentProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      feedbackTicket: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
      ticketMessage: {
        create: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    service = new FeedbackService(mockPrisma);
  });

  describe('createTicket', () => {
    it('should reject tickets with empty description', async () => {
      await expect(
        service.createTicket({ userId: 'u1', description: '' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a feedback ticket when student profile exists', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 'stu-1', userId: 'u1' });
      mockPrisma.feedbackTicket.create.mockResolvedValue({
        id: 'tick-1',
        studentProfileId: 'stu-1',
        description: 'Attendance not marked for OS lab',
        status: 'OPEN',
      });

      const res = await service.createTicket({
        userId: 'u1',
        subject: 'Attendance Discrepancy',
        description: 'Attendance not marked for OS lab',
        category: 'ATTENDANCE_DISPUTE',
      });

      expect(res.id).toBe('tick-1');
      expect(res.status).toBe('OPEN');
      expect(mockPrisma.feedbackTicket.create).toHaveBeenCalled();
    });
  });

  describe('updateTicketStatus', () => {
    it('should reject invalid ticket status transitions', async () => {
      await expect(
        service.updateTicketStatus('tick-1', 'INVALID_STATUS', 'admin-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if ticket does not exist', async () => {
      mockPrisma.feedbackTicket.findUnique.mockResolvedValue(null);
      await expect(
        service.updateTicketStatus('tick-nonexistent', 'RESOLVED', 'admin-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should update status and record an audit log', async () => {
      mockPrisma.feedbackTicket.findUnique.mockResolvedValue({ id: 'tick-1', status: 'OPEN' });
      mockPrisma.feedbackTicket.update.mockResolvedValue({ id: 'tick-1', status: 'RESOLVED' });
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'aud-1' });

      const res = await service.updateTicketStatus('tick-1', 'RESOLVED', 'admin-1');
      expect(res.status).toBe('RESOLVED');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'admin-1',
          action: 'FEEDBACK_TICKET_STATUS_UPDATED',
        }),
      });
    });
  });

  describe('addReply', () => {
    it('should reject empty reply message', async () => {
      await expect(
        service.addReply('tick-1', 'u1', '   ')
      ).rejects.toThrow(BadRequestException);
    });

    it('should create ticket message and update ticket timestamp', async () => {
      mockPrisma.feedbackTicket.findUnique.mockResolvedValue({ id: 'tick-1' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      mockPrisma.ticketMessage.create.mockResolvedValue({ id: 'msg-1', message: 'Investigating issue' });
      mockPrisma.feedbackTicket.update.mockResolvedValue({ id: 'tick-1' });

      const res = await service.addReply('tick-1', 'u1', 'Investigating issue');
      expect(res.id).toBe('msg-1');
      expect(mockPrisma.feedbackTicket.update).toHaveBeenCalledWith({
        where: { id: 'tick-1' },
        data: { updatedAt: expect.any(Date) },
      });
    });
  });
});

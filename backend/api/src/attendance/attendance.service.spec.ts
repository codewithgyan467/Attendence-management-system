import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AttendanceService, getISTDate, formatTimeHHMM, formatDateYYYYMMDD } from './attendance.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AttendanceService (Core Business Logic & Rules Engine)', () => {
  let service: AttendanceService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      holiday: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      timetableEntry: {
        findMany: vi.fn(),
      },
      academicTerm: {
        findFirst: vi.fn(),
      },
      classSession: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      attendanceRecord: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
      },
      enrollment: {
        findFirst: vi.fn(),
      },
      facultyProfile: {
        findFirst: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mockPrisma)),
    };

    service = new AttendanceService(mockPrisma);
  });

  describe('Authoritative Time & Geofence Math', () => {
    it('should compute valid IST date and timezone structure', async () => {
      const clock = await service.getLiveClockData();
      expect(clock.source).toBe('AuthoritativeServerIST');
      expect(clock.timezone).toBe('Asia/Kolkata (IST)');
      expect(clock.date).toBeInstanceOf(Date);
    });

    it('should calculate accurate Haversine distance between two coordinates', () => {
      // AEC MCA Department (~26.1412, 91.6620) to a point ~100m away (26.1420, 91.6620)
      const distance = (service as any).getDistance(26.1412, 91.6620, 26.1420, 91.6620);
      expect(distance).toBeGreaterThan(80);
      expect(distance).toBeLessThan(110);
    });
  });

  describe('Holiday Enforcement', () => {
    it('should block attendance marking when today is an institutional holiday', async () => {
      mockPrisma.holiday.findFirst.mockResolvedValue({
        id: 'hol-1',
        title: 'Bihu Festival',
        date: formatDateYYYYMMDD(getISTDate()),
      });

      await expect(
        service.markAttendance({
          studentProfileId: 'stu-1',
          classSessionId: 'sess-1',
          verificationMethod: 'FACE_GPS',
          latitude: 26.1412,
          longitude: 91.6620,
          gpsAccuracy: 10,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Timetable Window & Duplicate Prevention', () => {
    it('should reject attendance if already marked for this subject session', async () => {
      mockPrisma.holiday.findFirst.mockResolvedValue(null);
      mockPrisma.attendanceRecord.findFirst.mockResolvedValue({ id: 'rec-1', status: 'PRESENT' });

      await expect(
        service.markAttendance({
          studentProfileId: 'stu-1',
          classSessionId: 'sess-1',
          verificationMethod: 'FACE_GPS',
          latitude: 26.1412,
          longitude: 91.6620,
          gpsAccuracy: 10,
        })
      ).rejects.toThrow('Attendance already marked for this subject session');
    });

    it('should reject if attendance window has expired', async () => {
      mockPrisma.holiday.findFirst.mockResolvedValue(null);
      mockPrisma.attendanceRecord.findFirst.mockResolvedValue(null);
      mockPrisma.classSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        status: 'ACTIVE',
        timetableEntry: {
          sectionId: 'sec-1',
          startTime: '08:00',
          endTime: '09:00',
          section: { subject: { name: 'Operating Systems' } },
        },
        classroom: { latitude: 26.1412, longitude: 91.6620, allowedRadiusMeters: 50 },
      });
      mockPrisma.enrollment.findFirst.mockResolvedValue({ id: 'enr-1' });

      // Simulate student trying to mark at 09:15
      await expect(
        service.markAttendance({
          studentProfileId: 'stu-1',
          classSessionId: 'sess-1',
          verificationMethod: 'FACE_GPS',
          simulateTime: '09:15',
          latitude: 26.1412,
          longitude: 91.6620,
          gpsAccuracy: 10,
        })
      ).rejects.toThrow('ATTENDANCE_WINDOW_EXPIRED');
    });

    it('should reject if student is not enrolled in the subject section', async () => {
      mockPrisma.holiday.findFirst.mockResolvedValue(null);
      mockPrisma.attendanceRecord.findFirst.mockResolvedValue(null);
      mockPrisma.classSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        status: 'ACTIVE',
        timetableEntry: {
          sectionId: 'sec-MCA-1A',
          startTime: '08:00',
          endTime: '09:00',
          section: { subject: { name: 'Operating Systems' } },
        },
        classroom: { latitude: 26.1412, longitude: 91.6620, allowedRadiusMeters: 50 },
      });

      // Enrollment returns null (not enrolled)
      mockPrisma.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.markAttendance({
          studentProfileId: 'stu-unauthorized',
          classSessionId: 'sess-1',
          verificationMethod: 'FACE_GPS',
          simulateTime: '08:30',
          latitude: 26.1412,
          longitude: 91.6620,
          gpsAccuracy: 10,
        })
      ).rejects.toThrow('NOT_ENROLLED_IN_SECTION');
    });
  });

  describe('Fail-Secure AI Policy & Geofencing', () => {
    it('should reject if student is outside classroom geofence radius', async () => {
      mockPrisma.holiday.findFirst.mockResolvedValue(null);
      mockPrisma.attendanceRecord.findFirst.mockResolvedValue(null);
      mockPrisma.classSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        status: 'ACTIVE',
        timetableEntry: {
          sectionId: 'sec-1',
          startTime: '08:00',
          endTime: '09:00',
          section: { subject: { name: 'Operating Systems' } },
        },
        classroom: { latitude: 26.1412, longitude: 91.6620, allowedRadiusMeters: 50 },
      });
      mockPrisma.enrollment.findFirst.mockResolvedValue({ id: 'enr-1' });

      // Student is at 26.1450, 91.6650 (~500m away)
      await expect(
        service.markAttendance({
          studentProfileId: 'stu-1',
          classSessionId: 'sess-1',
          verificationMethod: 'FACE_GPS',
          simulateTime: '08:30',
          latitude: 26.1450,
          longitude: 91.6650,
          gpsAccuracy: 10,
        })
      ).rejects.toThrow('OUTSIDE_LOCATION');
    });

    it('should fail secure to REVIEW_REQUIRED if AI microservice is unavailable', async () => {
      mockPrisma.holiday.findFirst.mockResolvedValue(null);
      mockPrisma.attendanceRecord.findFirst.mockResolvedValue(null);
      mockPrisma.classSession.findUnique.mockResolvedValue({
        id: 'sess-1',
        status: 'ACTIVE',
        timetableEntry: {
          sectionId: 'sec-1',
          startTime: '08:00',
          endTime: '09:00',
          section: { subject: { name: 'Operating Systems' } },
        },
        classroom: { latitude: 26.1412, longitude: 91.6620, allowedRadiusMeters: 100 },
      });
      mockPrisma.enrollment.findFirst.mockResolvedValue({ id: 'enr-1' });

      // AI service fails / connection refused
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      mockPrisma.attendanceRecord.create.mockImplementation(({ data }: any) => Promise.resolve({ id: 'rec-fail-sec', ...data }));

      const result = await service.markAttendance({
        studentProfileId: 'stu-1',
        classSessionId: 'sess-1',
        verificationMethod: 'FACE_GPS',
        simulateTime: '08:30',
        latitude: 26.1412,
        longitude: 91.6620,
        gpsAccuracy: 10,
        base64Image: 'data:image/jpeg;base64,mockImage',
      } as any);

      // Verify fail-secure behavior
      expect(result.status).toBe('REVIEW_REQUIRED');
      expect(result.verificationMethod).toBe('FACE_AI_UNAVAILABLE_REVIEW');
      expect((result as any).riskFlag).toBe('AI_SERVICE_UNAVAILABLE_REVIEW_NEEDED');

      global.fetch = originalFetch;
    });
  });

  describe('Administrative Overrides & Audit Trail', () => {
    it('should create an audit log when an admin overrides attendance status', async () => {
      mockPrisma.attendanceRecord.findUnique.mockResolvedValue({
        id: 'rec-1',
        studentProfileId: 'stu-1',
        classSessionId: 'sess-1',
        status: 'ABSENT',
      });
      mockPrisma.attendanceRecord.update.mockResolvedValue({
        id: 'rec-1',
        status: 'EXCUSED',
        verificationMethod: 'MANUAL_OVERRIDE',
        notes: 'Medical certificate approved by HOD',
      });

      const result = await service.adminOverrideRecord({
        recordId: 'rec-1',
        status: 'EXCUSED',
        adminUserId: 'admin-aec-hod',
        notes: 'Medical certificate approved by HOD',
      });

      expect(result.status).toBe('EXCUSED');
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'admin-aec-hod',
          action: 'ATTENDANCE_OVERRIDE',
          details: expect.stringContaining('Medical certificate approved by HOD'),
        }),
      });
    });
  });
});

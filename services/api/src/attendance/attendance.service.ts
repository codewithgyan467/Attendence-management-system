import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type AttendanceStatus = 'PENDING' | 'PRESENT' | 'LATE' | 'REJECTED';
type VerificationMethod = 'OFFLINE_PENDING' | 'FACE_GPS' | 'MANUAL_OVERRIDE' | 'NONE';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // --- Faculty Actions ---
  async getFacultyTimetable(facultyProfileId: string) {
    // Get all sections assigned to this faculty
    const assignments = await this.prisma.classAssignment.findMany({
      where: { facultyProfileId },
      select: { sectionId: true }
    });
    
    const sectionIds = assignments.map(a => a.sectionId);

    // Get today's day of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const dayOfWeek = new Date().getDay();

    // Find timetable entries for these sections for today
    return this.prisma.timetableEntry.findMany({
      where: {
        sectionId: { in: sectionIds },
        dayOfWeek
      },
      include: {
        section: {
          include: { subject: true }
        },
        classroom: true
      },
      orderBy: { startTime: 'asc' }
    });
  }

  async startSession(facultyProfileId: string, classroomId: string, timetableEntryId?: string) {
    const existing = await this.prisma.classSession.findFirst({
      where: { classroomId, status: 'ACTIVE' }
    });
    
    if (existing) {
      throw new BadRequestException('Classroom already has an active session');
    }

    return this.prisma.classSession.create({
      data: {
        facultyProfileId,
        classroomId,
        timetableEntryId,
        status: 'ACTIVE',
        startTime: new Date()
      }
    });
  }

  async endSession(sessionId: string, facultyProfileId: string) {
    const session = await this.prisma.classSession.findFirst({
      where: { id: sessionId, facultyProfileId }
    });
    if (!session) throw new NotFoundException('Session not found or unauthorized');

    return this.prisma.classSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endTime: new Date()
      }
    });
  }

  async getSessionAttendance(sessionId: string, facultyProfileId: string) {
    // Verify session belongs to faculty
    const session = await this.prisma.classSession.findFirst({
      where: { id: sessionId, facultyProfileId },
      include: {
        timetableEntry: {
          include: {
            section: {
              include: {
                enrollments: {
                  include: {
                    student: {
                      include: { user: true }
                    }
                  }
                }
              }
            }
          }
        },
        attendanceRecords: {
          include: {
            student: {
              include: { user: true }
            }
          }
        }
      }
    });

    if (!session) throw new NotFoundException('Session not found or unauthorized');

    // Compile roster
    const allEnrolled = session.timetableEntry?.section?.enrollments?.map(e => e.student) || [];
    const attendedIds = session.attendanceRecords.map(r => r.studentProfileId);
    
    const roster = allEnrolled.map(student => {
      const record = session.attendanceRecords.find(r => r.studentProfileId === student.id);
      return {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        enrollmentNo: student.enrollmentNo,
        status: record ? record.status : 'PENDING',
        time: record ? record.markedAt : null
      };
    });

    // If there are attendance records from students not explicitly enrolled (e.g., bridge course), add them
    for (const record of session.attendanceRecords) {
      if (!attendedIds.includes(record.studentProfileId) && !allEnrolled.find(s => s.id === record.studentProfileId)) {
        roster.push({
          id: record.student.id,
          name: `${record.student.user.firstName} ${record.student.user.lastName}`,
          enrollmentNo: record.student.enrollmentNo,
          status: record.status,
          time: record.markedAt
        });
      }
    }

    return roster;
  }

  // --- Student Actions ---
  async getActiveSessionsForStudent(studentProfileId: string) {
    return this.prisma.classSession.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: { classroom: true, faculty: { include: { user: true } } }
    });
  }

  // Haversine distance calculation in meters
  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  async markAttendance(data: {
    eventId?: string;
    studentProfileId: string;
    classSessionId: string;
    verificationMethod: string;
    latitude?: number;
    longitude?: number;
    gpsAccuracy?: number;
    faceScore?: number;
    livenessScore?: number;
  }) {
    // Duplicate check
    if (data.eventId) {
      const existing = await this.prisma.attendanceRecord.findUnique({
        where: { eventId: data.eventId }
      });
      if (existing) return existing;
    }
    
    // Check if user already marked attendance for this session
    const duplicate = await this.prisma.attendanceRecord.findFirst({
      where: {
        classSessionId: data.classSessionId,
        studentProfileId: data.studentProfileId
      }
    });
    if (duplicate) {
      throw new BadRequestException('Attendance already marked for this session');
    }

    const session = await this.prisma.classSession.findUnique({
      where: { id: data.classSessionId },
      include: { classroom: true }
    });

    if (!session || session.status !== 'ACTIVE') {
      throw new BadRequestException('Session is not active');
    }

    let finalStatus: AttendanceStatus = 'PENDING';
    let calculatedDistance = null;
    let aiFaceScore = data.faceScore || 0.0;
    let aiLivenessScore = data.livenessScore || 0.0;

    if (data.verificationMethod === 'OFFLINE_PENDING') {
      finalStatus = 'PENDING';
    } else {
      // ONLINE_GPS Verification
      if (!data.latitude || !data.longitude || !data.gpsAccuracy) {
        throw new BadRequestException('GPS_UNAVAILABLE: GPS coordinates required');
      }

      if (data.gpsAccuracy > (session.classroom.maxGpsAccuracy || 50)) {
        throw new BadRequestException(`GPS_POOR_ACCURACY: Accuracy ${data.gpsAccuracy}m is too low. Move near a window.`);
      }

      if (!session.classroom.latitude || !session.classroom.longitude) {
        throw new BadRequestException('Classroom GPS coordinates not configured.');
      }

      calculatedDistance = this.getDistance(
        data.latitude, data.longitude,
        session.classroom.latitude, session.classroom.longitude
      );

      const radius = session.classroom.allowedRadiusMeters || 50;
      
      // Verification rules
      let failedGps = false;
      let gpsError = "";

      if (calculatedDistance > radius) {
        failedGps = true;
        gpsError = `OUTSIDE_LOCATION: You are ${Math.round(calculatedDistance)}m away. Must be within ${radius}m.`;
      }

      // If client provided a base64 image, forward to AI service
      if ((data as any).base64Image) {
        try {
          const aiRes = await fetch('http://127.0.0.1:8000/verify/liveness', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: data.studentProfileId,
              image_base64: (data as any).base64Image
            })
          });
          
          if (!aiRes.ok) {
            const errData = await aiRes.json();
            throw new BadRequestException('AI_ERROR: ' + (errData.detail || 'Liveness check failed'));
          }
          
          const aiData = await aiRes.json();
          if (!aiData.is_live) {
             throw new BadRequestException('LIVENESS_FAILED: Face must be a real person, not a photo.');
          }
          
          aiLivenessScore = aiData.liveness_score;
          aiFaceScore = 1.0; // Mocking structural match since we lack reference DB images for now
          
        } catch (e: any) {
           if (e instanceof BadRequestException) throw e;
           throw new BadRequestException('AI_SERVICE_UNAVAILABLE: ' + e.message);
        }
      } else {
        if (!data.faceScore || data.faceScore < 0.85) {
          throw new BadRequestException('FACE_FAILED: Your face could not be verified.');
        }
        if (!data.livenessScore || data.livenessScore < 0.5) {
          throw new BadRequestException('LIVENESS_FAILED: Liveness check failed.');
        }
      }

      if (failedGps) {
        finalStatus = 'REJECTED';
        throw new BadRequestException(gpsError);
      }

      // If all passed:
      const sessionDurationMinutes = (new Date().getTime() - session.startTime.getTime()) / 60000;
      if (sessionDurationMinutes > 15) {
        finalStatus = 'LATE';
      } else {
        finalStatus = 'PRESENT';
      }
    }

    return this.prisma.attendanceRecord.create({
      data: {
        eventId: data.eventId,
        studentProfileId: data.studentProfileId,
        classSessionId: data.classSessionId,
        verificationMethod: data.verificationMethod === 'OFFLINE_PENDING' ? 'OFFLINE_PENDING' : 'FACE_GPS',
        latitude: data.latitude,
        longitude: data.longitude,
        distanceMeters: calculatedDistance,
        gpsAccuracy: data.gpsAccuracy,
        faceScore: aiFaceScore,
        livenessScore: aiLivenessScore,
        status: finalStatus,
      }
    });
  }
}

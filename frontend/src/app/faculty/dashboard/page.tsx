'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import ClockWidget from '@/components/ClockWidget';
import FacultyAnalytics from '@/components/FacultyAnalytics';

export default function FacultyDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<any | null>(null);
  const [facultyName, setFacultyName] = useState('Dr. S. Bordoloi (SB)');
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [simDay, setSimDay] = useState<number | null>(null);
  const [simTime, setSimTime] = useState<string | null>(null);
  const [simChoice, setSimChoice] = useState('live');

  const fetchScheduleAndClasses = useCallback(async (authToken: string, day: number | null, time: string | null) => {
    try {
      const params = new URLSearchParams();
      if (day !== null) params.append('simulateDay', String(day));
      if (time !== null) params.append('simulateTime', time);
      params.append('semester', '1');

      const [scheduleRes, ttRes] = await Promise.all([
        fetch(`${API_URL}/attendance/live-schedule?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch(`${API_URL}/attendance/faculty/timetable`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      if (scheduleRes.ok) {
        const sData = await scheduleRes.json();
        setScheduleData(sData);

        // Fetch roster if active session exists
        if (sData.active && sData.session) {
          const rRes = await fetch(`${API_URL}/attendance/session/${sData.session.id}/attendance`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (rRes.ok) {
            setRoster(await rRes.json());
          }
        }
      }

      if (ttRes.ok) {
        setTodayClasses(await ttRes.json());
      }
    } catch (e) {
      console.error('Faculty fetch error:', e);
    }
  }, []);

  const fetchProfile = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        if (data.firstName) {
          setFacultyName(`${data.firstName} ${data.lastName}`);
        }
      }
    } catch (e) {
      console.error('Failed to load faculty profile:', e);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      window.location.href = '/';
      return;
    }
    setToken(storedToken);
    fetchProfile(storedToken);
    fetchScheduleAndClasses(storedToken, simDay, simTime);
  }, [fetchScheduleAndClasses, simDay, simTime]);

  // Periodic roster polling when session is active
  useEffect(() => {
    if (!token || !scheduleData?.session?.id) return;
    const interval = setInterval(async () => {
      try {
        const rRes = await fetch(`${API_URL}/attendance/session/${scheduleData.session.id}/attendance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (rRes.ok) {
          setRoster(await rRes.json());
        }
      } catch (e) {
        console.error('Roster polling error:', e);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [token, scheduleData?.session?.id]);

  const handleSimulation = (day: number | null, time: string | null) => {
    setSimDay(day);
    setSimTime(time);
    if (!day) setSimChoice('live');
    else if (day === 2 && time === '08:15') setSimChoice('tue-os');
    else if (day === 2 && time === '09:30') setSimChoice('tue-lab');
    else if (day === 3 && time === '11:15') setSimChoice('wed-coa');
    else if (day === 5 && time === '14:20') setSimChoice('fri-os');

    if (token) fetchScheduleAndClasses(token, day, time);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const presentCount = roster.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const pendingCount = roster.filter(r => r.status === 'PENDING').length;

  return (
    <div className="min-vh-100 bg-light py-4 text-dark">
      <div className="container" style={{ maxWidth: 1040 }}>
        
        {/* Interactive Faculty Profile Header Card */}
        <div className="card shadow-sm border-0 rounded-4 mb-4 bg-white">
          <div className="card-body p-4">
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-3">
                {/* Faculty Avatar */}
                <div 
                  className="rounded-circle bg-primary-subtle text-primary border border-2 border-primary-subtle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                  style={{ width: 72, height: 72, fontSize: 24 }}
                >
                  <span>{userProfile?.firstName?.[0] || 'D'}{userProfile?.lastName?.[0] || 'R'}</span>
                </div>

                {/* Faculty Details */}
                <div>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                    <h3 className="h4 fw-bold mb-0 text-dark">
                      {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : facultyName}
                    </h3>
                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill">
                      👨‍🏫 FACULTY
                    </span>
                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">
                      Active Session Lead
                    </span>
                  </div>

                  <p className="small text-muted mb-1">
                    Assam Engineering College • Department of Computer Applications
                  </p>

                  <div className="d-flex flex-wrap align-items-center gap-2 small text-secondary font-monospace">
                    <span>Emp ID: <strong className="text-dark">{userProfile?.facultyProfile?.employeeId || 'FAC-MCA-01'}</strong></span>
                    <span>•</span>
                    <span>Email: <strong className="text-dark">{userProfile?.email || 'faculty@aec.ac.in'}</strong></span>
                    {userProfile?.phone && (
                      <>
                        <span>•</span>
                        <span>Phone: <strong className="text-dark">{userProfile.phone}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Logout */}
              <div className="d-flex align-items-center gap-2 align-self-end align-self-md-center">
                <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill small">
                  ● Timetable Enforced
                </span>
                <button 
                  onClick={handleLogout}
                  className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1.5 fw-semibold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Clock & Timetable Routine Component */}
        <div className="mb-4">
          <ClockWidget 
            scheduleData={scheduleData}
            onSimulationChange={handleSimulation}
            selectedSimulation={simChoice}
          />
        </div>

        {/* Live Active Session Panel */}
        {scheduleData?.active && scheduleData?.slot ? (
          <div className="space-y-4 mb-4">
            <div className="card shadow-sm border-0 rounded-4 bg-white mb-4">
              <div className="card-header bg-white border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                <div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill mb-1">
                    ● Session Open
                  </span>
                  <h4 className="fw-bold text-dark mb-0">
                    {scheduleData.slot.subject} ({scheduleData.slot.code})
                  </h4>
                </div>
                <div className="text-end">
                  <span className="badge bg-light text-dark border">
                    Room {scheduleData.slot.classroom}
                  </span>
                  <div className="small text-muted mt-1">
                    {scheduleData.slot.startTime} — {scheduleData.slot.endTime}
                  </div>
                </div>
              </div>

              <div className="card-body p-4">
                {/* Stats Row */}
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 border text-center">
                      <span className="text-muted small fw-semibold text-uppercase">Present Students</span>
                      <div className="display-6 fw-bold text-success mt-1">{presentCount}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3 border text-center">
                      <span className="text-muted small fw-semibold text-uppercase">Pending in Roster</span>
                      <div className="display-6 fw-bold text-warning mt-1">{pendingCount}</div>
                    </div>
                  </div>
                </div>

                {/* Live Attendance Table */}
                <div className="border rounded-3 overflow-hidden">
                  <div className="bg-light px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
                    <span className="fw-bold small text-dark">
                      Class Roster Stream ({roster.length} registered students)
                    </span>
                    <span className="badge bg-secondary-subtle text-secondary small">
                      Refreshes every 4s
                    </span>
                  </div>

                  {roster.length === 0 ? (
                    <div className="p-4 text-center text-muted small">
                      Waiting for enrolled students to verify biometric attendance...
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: 380 }}>
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light small">
                          <tr>
                            <th style={{ width: 60 }}>Status</th>
                            <th>Student Name</th>
                            <th>Roll Number</th>
                            <th className="text-end">Verification</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roster.map((student) => {
                            const isPresent = student.status === 'PRESENT';
                            const isLate = student.status === 'LATE';
                            return (
                              <tr key={student.id}>
                                <td>
                                  <span className={`badge rounded-circle p-2 ${
                                    isPresent ? 'bg-success' : isLate ? 'bg-warning' : 'bg-secondary'
                                  }`}>
                                    {isPresent ? '✓' : isLate ? '⏰' : '—'}
                                  </span>
                                </td>
                                <td>
                                  <div className="fw-semibold text-dark">{student.name}</div>
                                </td>
                                <td>
                                  <span className="font-monospace text-muted small">{student.enrollmentNo}</span>
                                </td>
                                <td className="text-end">
                                  {isPresent ? (
                                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">
                                      Present
                                    </span>
                                  ) : isLate ? (
                                    <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill">
                                      Late
                                    </span>
                                  ) : (
                                    <span className="badge bg-light text-secondary border rounded-pill">
                                      Pending
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card shadow-sm border-0 rounded-4 bg-white p-5 text-center mb-4">
            <div className="display-4 mb-2">📋</div>
            <h5 className="fw-bold text-dark mb-1">No Active Timetable Session Right Now</h5>
            <p className="text-muted small max-w-md mx-auto mb-0">
              Under strict AEC routine enforcement, attendance sessions automatically open and close precisely with each scheduled timetable slot. You can use the routine simulator above to preview upcoming sessions.
            </p>
          </div>
        )}

        {/* Faculty Analytics & Department Charts */}
        <div className="mb-4">
          <FacultyAnalytics 
            facultyName={userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : facultyName}
            totalStudents={roster.length || 68}
          />
        </div>

      </div>
    </div>
  );
}

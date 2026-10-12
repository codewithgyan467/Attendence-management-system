'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '@/lib/api';

export default function TimetableManagement() {
  const [activeTab, setActiveTab] = useState<'timetable' | 'assignments' | 'syllabus' | 'terms'>('timetable');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  // Filters & View Modes
  const [timetableSemFilter, setTimetableSemFilter] = useState<'ALL' | 1 | 3>('ALL');
  const [timetableDayFilter, setTimetableDayFilter] = useState<'ALL' | number>('ALL');
  const [ttViewMode, setTtViewMode] = useState<'grid' | 'table'>('grid');
  const [subjectSemFilter, setSubjectSemFilter] = useState<'ALL' | number>('ALL');
  const [assignmentSearch, setAssignmentSearch] = useState('');

  // Timetable Slot Modal (Add & Edit)
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotTermId, setSlotTermId] = useState('');
  const [slotSectionId, setSlotSectionId] = useState('');
  const [slotClassroomId, setSlotClassroomId] = useState('');
  const [slotDay, setSlotDay] = useState(1);
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('10:00');
  const [slotSubjectType, setSlotSubjectType] = useState('Theory');
  const [slotFacultyProfileId, setSlotFacultyProfileId] = useState('');
  const [slotFacultyInitials, setSlotFacultyInitials] = useState('');

  // Course Reassignment Modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedSectionForReassign, setSelectedSectionForReassign] = useState<any | null>(null);
  const [targetFacultyProfileId, setTargetFacultyProfileId] = useState('');

  // Bulk Faculty Transfer Modal
  const [showBulkTransferModal, setShowBulkTransferModal] = useState(false);
  const [transferFromFacultyId, setTransferFromFacultyId] = useState('');
  const [transferToFacultyId, setTransferToFacultyId] = useState('');

  // Subject Modal (Add & Edit)
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subCode, setSubCode] = useState('');
  const [subName, setSubName] = useState('');
  const [subSem, setSubSem] = useState(1);
  const [subType, setSubType] = useState('Theory');
  const [subSyllabus, setSubSyllabus] = useState('');

  const daysOfWeek = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
  ];

  const showToast = (type: 'success' | 'danger', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [subRes, termsRes, ttRes, secRes, clsRes, facRes, caRes] = await Promise.all([
        fetch(`${API_URL}/academic/subjects`, { headers }),
        fetch(`${API_URL}/academic/terms`, { headers }),
        fetch(`${API_URL}/academic/timetable`, { headers }),
        fetch(`${API_URL}/academic/sections`, { headers }),
        fetch(`${API_URL}/academic/classrooms`, { headers }),
        fetch(`${API_URL}/academic/faculty`, { headers }),
        fetch(`${API_URL}/academic/course-assignments`, { headers }),
      ]);

      if (subRes.ok) setSubjects(await subRes.json());
      if (termsRes.ok) setTerms(await termsRes.json());
      if (ttRes.ok) setTimetable(await ttRes.json());
      if (secRes.ok) setSections(await secRes.json());
      if (clsRes.ok) setClassrooms(await clsRes.json());
      if (facRes.ok) setFacultyList(await facRes.json());
      if (caRes.ok) setCourseAssignments(await caRes.json());
    } catch (err) {
      console.error('Failed to fetch timetable data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle open Add Slot modal
  const handleOpenAddSlot = () => {
    setEditingSlotId(null);
    setSlotTermId(terms[0]?.id || '');
    setSlotSectionId(sections[0]?.id || '');
    setSlotClassroomId(classrooms[0]?.id || '');
    setSlotDay(1);
    setSlotStartTime('09:00');
    setSlotEndTime('10:00');
    setSlotSubjectType('Theory');
    setSlotFacultyProfileId('');
    setSlotFacultyInitials('');
    setShowSlotModal(true);
  };

  // Handle open Edit Slot modal
  const handleOpenEditSlot = (slot: any) => {
    setEditingSlotId(slot.id);
    setSlotTermId(slot.academicTermId || slot.academicTerm?.id || terms[0]?.id || '');
    setSlotSectionId(slot.sectionId || slot.section?.id || '');
    setSlotClassroomId(slot.classroomId || slot.classroom?.id || '');
    setSlotDay(slot.dayOfWeek);
    setSlotStartTime(slot.startTime);
    setSlotEndTime(slot.endTime);
    setSlotSubjectType(slot.subjectType || 'Theory');
    setSlotFacultyProfileId(slot.facultyProfileId || '');
    setSlotFacultyInitials(slot.facultyInitials || '');
    setShowSlotModal(true);
  };

  // Submit Slot (Create or Update)
  const handleSubmitSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    const payload = {
      academicTermId: slotTermId || terms[0]?.id,
      sectionId: slotSectionId,
      classroomId: slotClassroomId,
      dayOfWeek: Number(slotDay),
      startTime: slotStartTime,
      endTime: slotEndTime,
      subjectType: slotSubjectType,
      facultyProfileId: slotFacultyProfileId || null,
      facultyInitials: slotFacultyInitials || null
    };

    try {
      let res;
      if (editingSlotId) {
        res = await fetch(`${API_URL}/academic/timetable/${editingSlotId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/academic/timetable`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast('success', editingSlotId ? 'Timetable slot updated successfully!' : 'New timetable slot added successfully!');
        setShowSlotModal(false);
        fetchData();
      } else {
        const err = await res.json();
        showToast('danger', err.message || 'Failed to save timetable slot');
      }
    } catch {
      showToast('danger', 'Network error while saving slot');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Slot
  const handleDeleteSlot = async (slotId: string, label: string) => {
    if (!confirm(`Are you sure you want to delete slot: ${label}?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/academic/timetable/${slotId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('success', 'Timetable slot deleted successfully');
        fetchData();
      } else {
        showToast('danger', 'Failed to delete timetable slot');
      }
    } catch {
      showToast('danger', 'Network error while deleting slot');
    }
  };

  // Open Reassign Modal for specific course
  const handleOpenReassignModal = (section: any) => {
    setSelectedSectionForReassign(section);
    const currentFacId = section.classAssignments?.[0]?.faculty?.id || '';
    setTargetFacultyProfileId(currentFacId);
    setShowReassignModal(true);
  };

  // Submit Course Reassignment
  const handleReassignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSectionForReassign || !targetFacultyProfileId) return;
    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/academic/reassign-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sectionId: selectedSectionForReassign.id,
          facultyProfileId: targetFacultyProfileId
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', data.message || 'Course assigned successfully!');
        setShowReassignModal(false);
        fetchData();
      } else {
        showToast('danger', data.message || 'Failed to reassign course');
      }
    } catch {
      showToast('danger', 'Network error while reassigning course');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Bulk Faculty Course Handover
  const handleBulkTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromFacultyId || !transferToFacultyId) {
      showToast('danger', 'Please select both retiring/transferred faculty and the successor faculty.');
      return;
    }
    if (transferFromFacultyId === transferToFacultyId) {
      showToast('danger', 'Source and replacement faculty cannot be the same person.');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/academic/transfer-faculty-courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fromFacultyProfileId: transferFromFacultyId,
          toFacultyProfileId: transferToFacultyId
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', data.message || 'All courses transferred successfully!');
        setShowBulkTransferModal(false);
        fetchData();
      } else {
        showToast('danger', data.message || 'Failed to execute bulk transfer');
      }
    } catch {
      showToast('danger', 'Network error during bulk transfer');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered timetable
  const filteredTimetable = timetable.filter((tt: any) => {
    if (timetableSemFilter !== 'ALL') {
      const sem = tt.section?.subject?.semester;
      if (sem && sem !== timetableSemFilter) return false;
    }
    if (timetableDayFilter !== 'ALL' && tt.dayOfWeek !== timetableDayFilter) {
      return false;
    }
    return true;
  });

  // Filtered assignments
  const filteredAssignments = courseAssignments.filter((sec: any) => {
    if (!assignmentSearch) return true;
    const q = assignmentSearch.toLowerCase();
    const code = sec.subject?.code?.toLowerCase() || '';
    const name = sec.subject?.name?.toLowerCase() || '';
    const facName = sec.classAssignments?.[0]?.faculty?.user
      ? `${sec.classAssignments[0].faculty.user.firstName} ${sec.classAssignments[0].faculty.user.lastName}`.toLowerCase()
      : '';
    return code.includes(q) || name.includes(q) || facName.includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div className={`alert alert-${notification.type} alert-dismissible fade show shadow-sm rounded-3 mb-4`} role="alert">
          <strong>{notification.type === 'success' ? '✅ Success: ' : '⚠️ Error: '}</strong>
          {notification.message}
          <button type="button" className="btn-close" onClick={() => setNotification(null)}></button>
        </div>
      )}

      {/* Control Header Card */}
      <div className="card shadow-sm border-0 rounded-4 bg-white mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">
                  Timetable & Course Control Hub
                </span>
                <span className="badge bg-light text-secondary border rounded-pill">
                  AEC MCA Department
                </span>
              </div>
              <h3 className="fw-bold text-dark mb-1">Routine & Course Faculty Management</h3>
              <p className="text-muted small mb-0">
                Manage lecture timetable slots, update rooms/times, and seamlessly reassign courses when faculty retire or transfer.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2">
              <button
                onClick={handleOpenAddSlot}
                className="btn btn-primary btn-sm rounded-pill px-3 py-2 fw-semibold shadow-sm d-flex align-items-center gap-1.5"
              >
                <span>➕</span> Add Timetable Slot
              </button>
              <button
                onClick={() => {
                  setTransferFromFacultyId(facultyList[0]?.id || '');
                  setTransferToFacultyId(facultyList[1]?.id || '');
                  setShowBulkTransferModal(true);
                }}
                className="btn btn-outline-warning text-dark btn-sm rounded-pill px-3 py-2 fw-semibold shadow-sm d-flex align-items-center gap-1.5"
              >
                <span>🔄</span> Faculty Handover Wizard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills bg-white p-2 rounded-4 shadow-sm border mb-4">
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('timetable')}
            className={`nav-link rounded-3 fw-semibold small ${activeTab === 'timetable' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`}
          >
            🗓️ Routine & Timetable ({timetable.length} slots)
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`nav-link rounded-3 fw-semibold small ${activeTab === 'assignments' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`}
          >
            👨‍🏫 Teacher Course Assignments ({courseAssignments.length} courses)
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`nav-link rounded-3 fw-semibold small ${activeTab === 'syllabus' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`}
          >
            📚 Subjects & Syllabus ({subjects.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('terms')}
            className={`nav-link rounded-3 fw-semibold small ${activeTab === 'terms' ? 'active bg-primary text-white shadow-sm' : 'text-secondary'}`}
          >
            ⏰ Academic Terms ({terms.length})
          </button>
        </li>
      </ul>

      {/* ======================= TAB 1: TIMETABLE & ROUTINE ======================= */}
      {activeTab === 'timetable' && (
        <div className="card shadow-sm border-0 rounded-4 bg-white mb-4">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Weekly Routine Slots</h5>
              <span className="small text-muted">Showing {filteredTimetable.length} of {timetable.length} timetable entries</span>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* Semester Filter */}
              <select
                className="form-select form-select-sm rounded-3"
                style={{ width: 'auto' }}
                value={timetableSemFilter}
                onChange={(e) => setTimetableSemFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value) as any)}
              >
                <option value="ALL">All Semesters</option>
                <option value={1}>Semester 1</option>
                <option value={3}>Semester 3</option>
              </select>

              {/* Day Filter */}
              <select
                className="form-select form-select-sm rounded-3"
                style={{ width: 'auto' }}
                value={timetableDayFilter}
                onChange={(e) => setTimetableDayFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              >
                <option value="ALL">All Days</option>
                {daysOfWeek.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  onClick={() => setTtViewMode('grid')}
                  className={`btn ${ttViewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setTtViewMode('table')}
                  className={`btn ${ttViewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          <div className="card-body p-4">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <div className="small text-muted">Loading timetable data...</div>
              </div>
            ) : filteredTimetable.length === 0 ? (
              <div className="text-center py-5">
                <div className="display-6 mb-2">📅</div>
                <h6 className="fw-bold text-dark">No Timetable Slots Match Selected Filter</h6>
                <p className="small text-muted mb-3">Adjust your semester or day filters, or add a new timetable slot.</p>
                <button onClick={handleOpenAddSlot} className="btn btn-primary btn-sm rounded-pill px-3">
                  ➕ Add New Slot
                </button>
              </div>
            ) : ttViewMode === 'table' ? (
              /* TABLE VIEW */
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th>Day</th>
                      <th>Time Slot</th>
                      <th>Subject & Code</th>
                      <th>Room</th>
                      <th>Type</th>
                      <th>Assigned Faculty</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTimetable.map((slot) => {
                      const dayName = daysOfWeek.find(d => d.id === slot.dayOfWeek)?.name || `Day ${slot.dayOfWeek}`;
                      const sub = slot.section?.subject;
                      return (
                        <tr key={slot.id}>
                          <td>
                            <span className="badge bg-light text-dark border fw-bold">{dayName}</span>
                          </td>
                          <td className="font-monospace small fw-bold text-primary">
                            {slot.startTime} — {slot.endTime}
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{sub?.name || 'Class Session'}</div>
                            <span className="small text-muted font-monospace">{sub?.code || '—'} (Sem {sub?.semester || 1})</span>
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary border">{slot.classroom?.name || 'Classroom'}</span>
                          </td>
                          <td>
                            <span className={`badge ${slot.subjectType === 'Lab' ? 'bg-info-subtle text-info border border-info-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'}`}>
                              {slot.subjectType || 'Theory'}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                              👨‍🏫 {slot.facultyInitials || 'Assigned'}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              onClick={() => handleOpenEditSlot(slot)}
                              className="btn btn-outline-primary btn-sm py-1 px-2 me-1 rounded-2"
                              title="Edit Slot"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slot.id, `${sub?.code || ''} on ${dayName}`)}
                              className="btn btn-outline-danger btn-sm py-1 px-2 rounded-2"
                              title="Delete Slot"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* GRID VIEW BY DAY */
              <div className="row g-4">
                {daysOfWeek.map((day) => {
                  const daySlots = filteredTimetable.filter(t => t.dayOfWeek === day.id);
                  if (timetableDayFilter !== 'ALL' && day.id !== timetableDayFilter) return null;

                  return (
                    <div key={day.id} className="col-12 col-md-6 col-xl-4">
                      <div className="card h-100 border rounded-3 bg-light">
                        <div className="card-header bg-white border-bottom py-2 px-3 d-flex align-items-center justify-content-between">
                          <span className="fw-bold text-dark">{day.name}</span>
                          <span className="badge bg-light text-secondary border">{daySlots.length} slots</span>
                        </div>
                        <div className="card-body p-2 space-y-2">
                          {daySlots.length === 0 ? (
                            <div className="text-center py-4 text-muted small">No scheduled slots</div>
                          ) : (
                            daySlots.map(slot => {
                              const sub = slot.section?.subject;
                              return (
                                <div key={slot.id} className="p-2.5 bg-white rounded-3 border shadow-xs mb-2">
                                  <div className="d-flex align-items-center justify-content-between mb-1">
                                    <span className="badge bg-primary-subtle text-primary font-monospace" style={{ fontSize: 11 }}>
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                    <div className="d-flex gap-1">
                                      <button
                                        onClick={() => handleOpenEditSlot(slot)}
                                        className="btn btn-link p-0 text-decoration-none text-primary"
                                        title="Edit"
                                        style={{ fontSize: 13 }}
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSlot(slot.id, `${sub?.code} on ${day.name}`)}
                                        className="btn btn-link p-0 text-decoration-none text-danger"
                                        title="Delete"
                                        style={{ fontSize: 13 }}
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                  <div className="fw-bold text-dark small mb-1">{sub?.name || 'Subject'}</div>
                                  <div className="d-flex flex-wrap align-items-center gap-1.5" style={{ fontSize: 11 }}>
                                    <span className="text-muted font-monospace">{sub?.code}</span>
                                    <span>•</span>
                                    <span className="badge bg-light text-secondary border">{slot.classroom?.name}</span>
                                    <span>•</span>
                                    <span className="badge bg-warning-subtle text-dark border">👨‍🏫 {slot.facultyInitials || 'Assigned'}</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB 2: TEACHER COURSE REASSIGNMENT HUB ======================= */}
      {activeTab === 'assignments' && (
        <div className="card shadow-sm border-0 rounded-4 bg-white mb-4">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Teacher Course Assignment & Succession Control</h5>
              <p className="small text-muted mb-0">
                Easily change course instructors when teachers retire, transfer to other institutions, or need coverage.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <input
                type="text"
                placeholder="Search by course code, name or teacher..."
                className="form-control form-control-sm rounded-pill"
                style={{ minWidth: 260 }}
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card-body p-4">
            <div className="alert alert-info border-info-subtle rounded-3 small p-3 mb-4 d-flex align-items-start gap-2">
              <span className="fs-5">ℹ️</span>
              <div>
                <strong>Seamless Faculty Course Transfer:</strong> Changing a teacher on any course automatically updates all related timetable routine slots and attendance logs. Classes proceed uninterrupted regardless of staff retirement or relocation.
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Course Code & Title</th>
                    <th>Semester</th>
                    <th>Currently Assigned Teacher</th>
                    <th>Weekly Timetable Slots</th>
                    <th className="text-end">Management Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((sec: any) => {
                    const assignedFaculty = sec.classAssignments?.[0]?.faculty;
                    const facultyUser = assignedFaculty?.user;
                    const timetableSlotsCount = sec.timetableEntries?.length || 0;

                    return (
                      <tr key={sec.id}>
                        <td>
                          <div className="fw-bold text-dark">{sec.subject?.name}</div>
                          <span className="badge bg-light text-muted border font-monospace me-1">{sec.subject?.code}</span>
                          <span className="small text-muted">{sec.name}</span>
                        </td>
                        <td>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            Semester {sec.subject?.semester || 1}
                          </span>
                        </td>
                        <td>
                          {facultyUser ? (
                            <div className="d-flex align-items-center gap-2">
                              <div className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, fontSize: 12 }}>
                                {facultyUser.firstName?.[0]}{facultyUser.lastName?.[0]}
                              </div>
                              <div>
                                <div className="fw-semibold text-dark small">{facultyUser.firstName} {facultyUser.lastName}</div>
                                <div className="text-muted font-monospace" style={{ fontSize: 11 }}>Emp ID: {assignedFaculty.employeeId}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                              ⚠️ Unassigned
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            📅 {timetableSlotsCount} active slots
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            onClick={() => handleOpenReassignModal(sec)}
                            className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold"
                          >
                            🔄 Change / Transfer Teacher
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: SYLLABUS & SUBJECT CATALOG ======================= */}
      {activeTab === 'syllabus' && (
        <div className="card shadow-sm border-0 rounded-4 bg-white mb-4">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Department Syllabus Catalog</h5>
              <span className="small text-muted">{subjects.length} registered institutional courses</span>
            </div>
            <select
              className="form-select form-select-sm rounded-3"
              style={{ width: 'auto' }}
              value={subjectSemFilter}
              onChange={(e) => setSubjectSemFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            >
              <option value="ALL">All Semesters</option>
              <option value={1}>Semester 1</option>
              <option value={2}>Semester 2</option>
              <option value={3}>Semester 3</option>
              <option value={4}>Semester 4</option>
            </select>
          </div>
          <div className="card-body p-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Code</th>
                    <th>Course Name</th>
                    <th>Semester</th>
                    <th>Type</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects
                    .filter(s => subjectSemFilter === 'ALL' || s.semester === subjectSemFilter)
                    .map(sub => (
                      <tr key={sub.id}>
                        <td className="font-monospace fw-bold text-primary">{sub.code}</td>
                        <td className="fw-semibold text-dark">{sub.name}</td>
                        <td><span className="badge bg-light text-dark border">Semester {sub.semester}</span></td>
                        <td><span className="badge bg-primary-subtle text-primary border border-primary-subtle">{sub.type || 'Theory'}</span></td>
                        <td className="small text-muted">{sub.department?.name || 'MCA'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 4: ACADEMIC TERMS ======================= */}
      {activeTab === 'terms' && (
        <div className="card shadow-sm border-0 rounded-4 bg-white mb-4">
          <div className="card-header bg-white border-bottom py-3 px-4">
            <h5 className="fw-bold mb-0 text-dark">Institutional Academic Terms</h5>
          </div>
          <div className="card-body p-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light small">
                  <tr>
                    <th>Term Name</th>
                    <th>Year</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {terms.map(t => (
                    <tr key={t.id}>
                      <td className="fw-bold text-dark">{t.name}</td>
                      <td>{t.year}</td>
                      <td className="small text-muted">{new Date(t.startDate).toLocaleDateString()}</td>
                      <td className="small text-muted">{new Date(t.endDate).toLocaleDateString()}</td>
                      <td>
                        {t.isCurrent ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill">
                            ● Active Current Term
                          </span>
                        ) : (
                          <span className="badge bg-light text-secondary border rounded-pill">
                            Archived
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ADD / EDIT TIMETABLE SLOT ======================= */}
      {showSlotModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark">
                  {editingSlotId ? '✏️ Edit Timetable Slot' : '➕ Add New Timetable Slot'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowSlotModal(false)}></button>
              </div>

              <form onSubmit={handleSubmitSlot}>
                <div className="modal-body p-4 space-y-3">
                  <div className="row g-3">
                    {/* Day of Week */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Day of Week</label>
                      <select
                        className="form-select rounded-3"
                        required
                        value={slotDay}
                        onChange={(e) => setSlotDay(Number(e.target.value))}
                      >
                        {daysOfWeek.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subject / Section */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Course / Section</label>
                      <select
                        className="form-select rounded-3"
                        required
                        value={slotSectionId}
                        onChange={(e) => setSlotSectionId(e.target.value)}
                      >
                        {sections.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.subject?.code} - {s.subject?.name} ({s.name})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Time */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Start Time (HH:mm)</label>
                      <input
                        type="time"
                        className="form-control rounded-3"
                        required
                        value={slotStartTime}
                        onChange={(e) => setSlotStartTime(e.target.value)}
                      />
                    </div>

                    {/* End Time */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">End Time (HH:mm)</label>
                      <input
                        type="time"
                        className="form-control rounded-3"
                        required
                        value={slotEndTime}
                        onChange={(e) => setSlotEndTime(e.target.value)}
                      />
                    </div>

                    {/* Classroom */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Classroom / Laboratory</label>
                      <select
                        className="form-select rounded-3"
                        required
                        value={slotClassroomId}
                        onChange={(e) => setSlotClassroomId(e.target.value)}
                      >
                        {classrooms.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.building || 'Campus'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subject Type */}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Session Type</label>
                      <select
                        className="form-select rounded-3"
                        value={slotSubjectType}
                        onChange={(e) => setSlotSubjectType(e.target.value)}
                      >
                        <option value="Theory">Theory Lecture</option>
                        <option value="Lab">Practical / Laboratory</option>
                        <option value="Bridge Course">Bridge Course</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Project">Project / Viva</option>
                      </select>
                    </div>

                    {/* Assigned Faculty Teacher */}
                    <div className="col-md-8">
                      <label className="form-label small fw-semibold text-secondary">Assigned Faculty Teacher</label>
                      <select
                        className="form-select rounded-3"
                        value={slotFacultyProfileId}
                        onChange={(e) => {
                          const fId = e.target.value;
                          setSlotFacultyProfileId(fId);
                          const fac = facultyList.find(f => f.id === fId);
                          if (fac?.user) {
                            setSlotFacultyInitials(`${fac.user.firstName?.[0] || ''}${fac.user.lastName?.[0] || ''}`.toUpperCase());
                          }
                        }}
                      >
                        <option value="">-- Select Teacher --</option>
                        {facultyList.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.user?.firstName} {f.user?.lastName} ({f.employeeId})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Teacher Initials */}
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-secondary">Initials / Acronym</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="e.g. SB, AB"
                        value={slotFacultyInitials}
                        onChange={(e) => setSlotFacultyInitials(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top p-3">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowSlotModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm">
                    {submitting ? 'Saving...' : editingSlotId ? 'Update Slot' : 'Create Slot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: REASSIGN SINGLE COURSE TEACHER ======================= */}
      {showReassignModal && selectedSectionForReassign && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark">
                  🔄 Reassign Course Instructor
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowReassignModal(false)}></button>
              </div>

              <form onSubmit={handleReassignCourse}>
                <div className="modal-body p-4 space-y-3">
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <span className="small text-muted text-uppercase fw-semibold">Target Course</span>
                    <h5 className="fw-bold text-dark mb-0 mt-1">
                      {selectedSectionForReassign.subject?.name} ({selectedSectionForReassign.subject?.code})
                    </h5>
                    <div className="small text-muted mt-1">
                      Section: {selectedSectionForReassign.name} • Semester {selectedSectionForReassign.subject?.semester}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      Select New / Replacement Faculty Teacher
                    </label>
                    <select
                      className="form-select form-select-lg rounded-3 fs-6"
                      required
                      value={targetFacultyProfileId}
                      onChange={(e) => setTargetFacultyProfileId(e.target.value)}
                    >
                      <option value="">-- Choose Faculty Member --</option>
                      {facultyList.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.user?.firstName} {f.user?.lastName} (ID: {f.employeeId}) — {f.user?.email}
                        </option>
                      ))}
                    </select>
                    <div className="small text-muted mt-2">
                      💡 All current and future timetable slots for this course will be immediately updated to the chosen teacher.
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top p-3">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowReassignModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || !targetFacultyProfileId} className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm">
                    {submitting ? 'Transferring Course...' : 'Confirm Reassignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: BULK FACULTY HANDOVER WIZARD ======================= */}
      {showBulkTransferModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4">
              <div className="modal-header border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark">
                  🔄 Faculty Handover & Retirement Wizard
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowBulkTransferModal(false)}></button>
              </div>

              <form onSubmit={handleBulkTransfer}>
                <div className="modal-body p-4 space-y-3">
                  <div className="alert alert-warning border-warning-subtle small mb-3">
                    <strong>Institutional Continuity:</strong> When a teacher is transferred or retired, use this wizard to transfer all of their courses, sections, and active routine timetable slots to a successor teacher in 1-click.
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      1. Retiring / Relocated Faculty Member (From)
                    </label>
                    <select
                      className="form-select rounded-3"
                      required
                      value={transferFromFacultyId}
                      onChange={(e) => setTransferFromFacultyId(e.target.value)}
                    >
                      <option value="">-- Select Outgoing Faculty --</option>
                      {facultyList.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.user?.firstName} {f.user?.lastName} ({f.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      2. Successor / Replacement Faculty Member (To)
                    </label>
                    <select
                      className="form-select rounded-3"
                      required
                      value={transferToFacultyId}
                      onChange={(e) => setTransferToFacultyId(e.target.value)}
                    >
                      <option value="">-- Select Incoming Faculty --</option>
                      {facultyList.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.user?.firstName} {f.user?.lastName} ({f.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-footer border-top p-3">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowBulkTransferModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-warning text-dark rounded-pill px-4 fw-bold shadow-sm">
                    {submitting ? 'Transferring All Courses...' : 'Execute Full Handover'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export default function TimetableManagement() {
  const [activeTab, setActiveTab] = useState<'syllabus' | 'terms' | 'timetable'>('timetable');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters & View Modes
  const [subjectSemFilter, setSubjectSemFilter] = useState<'ALL' | number>('ALL');
  const [timetableSemFilter, setTimetableSemFilter] = useState<'ALL' | 1 | 3>('ALL');
  const [ttViewMode, setTtViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [editingSubject, setEditingSubject] = useState<any | null>(null);
  const [editingTerm, setEditingTerm] = useState<any | null>(null);
  const [editingSlot, setEditingSlot] = useState<any | null>(null);
  const [viewingSyllabus, setViewingSyllabus] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [subRes, termsRes, ttRes, secRes, clsRes] = await Promise.all([
          fetch(`${API_URL}/academic/subjects`, { headers }),
          fetch(`${API_URL}/academic/terms`, { headers }),
          fetch(`${API_URL}/academic/timetable`, { headers }),
          fetch(`${API_URL}/academic/sections`, { headers }),
          fetch(`${API_URL}/academic/classrooms`, { headers }),
        ]);

        if (subRes.ok) setSubjects(await subRes.json());
        if (termsRes.ok) setTerms(await termsRes.json());
        if (ttRes.ok) setTimetable(await ttRes.json());
        if (secRes.ok) setSections(await secRes.json());
        if (clsRes.ok) setClassrooms(await clsRes.json());
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSubjects = subjects.filter((s: any) => {
    if (subjectSemFilter === 'ALL') return true;
    return s.semester === subjectSemFilter;
  });

  const filteredTimetable = timetable.filter((tt: any) => {
    if (timetableSemFilter === 'ALL') return true;
    const termName = tt.academicTerm?.name || '';
    if (timetableSemFilter === 1) return termName.includes('1st');
    if (timetableSemFilter === 3) return termName.includes('3rd');
    return true;
  });

  const daysOfWeek = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Institutional Header */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Universal Institutional Scaling Engine
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Assam Engineering College (AEC)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Academic Routine & Syllabus Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Department of Computer Applications • MCA 1st Sem (wef 17/08/2026) & 3rd Sem (wef 03/08/2026)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-slate-300">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">GPS Campus Core</div>
            <div className="font-mono font-bold text-sky-400">26.140537, 91.656738 (500m)</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 glass-panel rounded-2xl border border-white/10 overflow-x-auto w-full sm:w-fit">
        <button 
          onClick={() => { setActiveTab('timetable'); setShowAddForm(false); }}
          className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'timetable'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>🗓️</span> Class Routine & Timetable
        </button>
        <button 
          onClick={() => { setActiveTab('syllabus'); setShowAddForm(false); }}
          className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'syllabus'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>📚</span> Syllabus & Subject Catalog
        </button>
        <button 
          onClick={() => { setActiveTab('terms'); setShowAddForm(false); }}
          className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'terms'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>⏰</span> Academic Terms
        </button>
      </div>

      {/* Content Container */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-6">
        
        {/* ===================== TAB 1: TIMETABLE & CLASS ROUTINE ===================== */}
        {activeTab === 'timetable' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Official Class Routine</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  {timetable.length} active weekly lecture, laboratory & seminar slots
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode Switch */}
                <div className="flex p-1 rounded-xl bg-slate-950 border border-white/10">
                  <button 
                    onClick={() => setTtViewMode('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      ttViewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📅 Routine Grid View
                  </button>
                  <button 
                    onClick={() => setTtViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      ttViewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📋 List Records
                  </button>
                </div>

                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="glass-btn px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>{showAddForm ? '✕ Close Form' : '+ Add Slot'}</span>
                </button>
              </div>
            </div>

            {/* Semester Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Filter By Semester:</span>
              <button 
                onClick={() => setTimetableSemFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timetableSemFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                All Semesters ({timetable.length})
              </button>
              <button 
                onClick={() => setTimetableSemFilter(1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timetableSemFilter === 1
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                MCA 1st Semester (wef 17/08/2026)
              </button>
              <button 
                onClick={() => setTimetableSemFilter(3)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timetableSemFilter === 3
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                MCA 3rd Semester (wef 03/08/2026)
              </button>
            </div>

            {/* Add Timetable Slot Form */}
            {showAddForm && (
              <div className="rounded-2xl p-5 sm:p-6 bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-indigo-400">➕</span> Schedule New Timetable Slot
                  </h3>
                  <span className="text-xs text-slate-400">Select section, classroom, day and time</span>
                </div>
                <form 
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    try {
                      const formData = new FormData(e.currentTarget);
                      const data = Object.fromEntries(formData.entries());
                      const token = localStorage.getItem('token');
                      const res = await fetch(`${API_URL}/academic/timetable`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(data)
                      });
                      if (res.ok) {
                        const newEntry = await res.json();
                        setTimetable([...timetable, newEntry]);
                        (e.target as HTMLFormElement).reset();
                        setShowAddForm(false);
                      } else {
                        alert('Failed to schedule timetable slot. Please verify inputs.');
                      }
                    } catch (err) {
                      alert('Error creating timetable record');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Academic Term</label>
                    <select required name="academicTermId" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                      <option value="" className="bg-slate-900 text-slate-300">Select Term</option>
                      {terms.map((t: any) => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Subject & Section</label>
                    <select required name="sectionId" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                      <option value="" className="bg-slate-900 text-slate-300">Select Section</option>
                      {sections.map((s: any) => (
                        <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                          {s.subject?.name} ({s.subject?.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Classroom</label>
                    <select required name="classroomId" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                      <option value="" className="bg-slate-900 text-slate-300">Select Classroom</option>
                      {classrooms.map((c: any) => (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Day of Week</label>
                    <select required name="dayOfWeek" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                      <option value="1" className="bg-slate-900 text-white">Monday</option>
                      <option value="2" className="bg-slate-900 text-white">Tuesday</option>
                      <option value="3" className="bg-slate-900 text-white">Wednesday</option>
                      <option value="4" className="bg-slate-900 text-white">Thursday</option>
                      <option value="5" className="bg-slate-900 text-white">Friday</option>
                      <option value="6" className="bg-slate-900 text-white">Saturday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Start Time</label>
                    <input required type="time" name="startTime" className="glass-input rounded-xl px-4 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">End Time</label>
                    <input required type="time" name="endTime" className="glass-input rounded-xl px-4 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Session Type</label>
                    <select required name="subjectType" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                      <option value="Theory" className="bg-slate-900 text-white">Theory</option>
                      <option value="Lab" className="bg-slate-900 text-white">Lab</option>
                      <option value="Bridge Course" className="bg-slate-900 text-white">Bridge Course</option>
                      <option value="Tutorial" className="bg-slate-900 text-white">Tutorial Class (TC)</option>
                      <option value="Elective" className="bg-slate-900 text-white">Elective</option>
                      <option value="Seminar" className="bg-slate-900 text-white">Mini Project / Seminar</option>
                      <option value="Activity" className="bg-slate-900 text-white">NBA Work / Activity</option>
                    </select>
                  </div>

                  <div>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30"
                    >
                      {submitting ? 'Scheduling...' : 'Save Slot'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================= ROUTINE GRID VIEW (MATRIX VIEW) ================= */}
            {ttViewMode === 'grid' && (
              <div className="space-y-6">
                {daysOfWeek.map((day) => {
                  const daySlots = filteredTimetable.filter((s: any) => s.dayOfWeek === day.id);
                  if (daySlots.length === 0) return null;

                  return (
                    <div key={day.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{day.name}</h3>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/10 text-slate-300">
                            {daySlots.length} Scheduled Classes
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {daySlots.map((slot: any) => {
                          const isSem1 = slot.academicTerm?.name?.includes('1st');
                          const isLab = slot.subjectType?.toLowerCase().includes('lab');
                          const isBridge = slot.subjectType?.toLowerCase().includes('bridge');
                          const isTutorial = slot.subjectType?.toLowerCase().includes('tutorial');

                          let badgeColor = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
                          if (isLab) badgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                          if (isBridge) badgeColor = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                          if (isTutorial) badgeColor = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';

                          return (
                            <div 
                              key={slot.id} 
                              className="rounded-xl p-3.5 bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-2 group shadow-md"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeColor}`}>
                                  {slot.subjectType}
                                </span>
                                <span className="font-mono text-xs font-semibold text-slate-300 bg-black/40 px-2 py-0.5 rounded-md">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </div>

                              <div>
                                <h4 className="text-sm font-bold text-white line-clamp-2">
                                  {slot.section?.subject?.name || slot.section?.name}
                                </h4>
                                <div className="text-xs text-indigo-300 font-mono mt-0.5">
                                  {slot.section?.subject?.code}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                                <span className="font-semibold text-slate-300">
                                  {slot.facultyInitials ? `Faculty: ${slot.facultyInitials}` : (isSem1 ? 'MCA Sem 1' : 'MCA Sem 3')}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {slot.classroom?.name?.split('/')[0]?.trim()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ================= ROUTINE LIST TABLE VIEW ================= */}
            {ttViewMode === 'table' && (
              <div className="overflow-x-auto w-full rounded-2xl border border-white/10 bg-slate-950/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-3.5 sm:p-4">Day</th>
                      <th className="p-3.5 sm:p-4">Timing</th>
                      <th className="p-3.5 sm:p-4">Term & Semester</th>
                      <th className="p-3.5 sm:p-4">Subject & Faculty</th>
                      <th className="p-3.5 sm:p-4">Classroom</th>
                      <th className="p-3.5 sm:p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {filteredTimetable.map((tt: any) => {
                      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      return (
                        <tr key={tt.id} className="hover:bg-white/[0.04] transition-colors">
                          <td className="p-3.5 sm:p-4">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                              {days[tt.dayOfWeek]}
                            </span>
                          </td>
                          <td className="p-3.5 sm:p-4 font-mono font-medium text-white text-xs sm:text-sm">
                            {tt.startTime} - {tt.endTime}
                          </td>
                          <td className="p-3.5 sm:p-4">
                            <div className="font-semibold text-white">{tt.academicTerm?.name?.split(' (')[0]}</div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {tt.subjectType}
                            </span>
                          </td>
                          <td className="p-3.5 sm:p-4">
                            <div className="font-semibold text-white">{tt.section?.subject?.name}</div>
                            <div className="text-xs text-indigo-300 font-mono font-medium">
                              {tt.section?.subject?.code} {tt.facultyInitials ? `• [${tt.facultyInitials}]` : ''}
                            </div>
                          </td>
                          <td className="p-3.5 sm:p-4 text-slate-300 font-medium">
                            {tt.classroom?.name}
                          </td>
                          <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                            <button 
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 mr-2 transition-colors cursor-pointer"
                              onClick={() => setEditingSlot(tt)}
                            >
                              ✎ Edit
                            </button>
                            <button 
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                              onClick={async () => {
                                if (confirm(`Delete slot ${tt.subjectType} - ${tt.startTime}?`)) {
                                  const token = localStorage.getItem('token');
                                  await fetch(`${API_URL}/academic/timetable/${tt.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                  setTimetable(timetable.filter((t: any) => t.id !== tt.id));
                                }
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTimetable.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          {loading ? 'Loading timetable records...' : 'No timetable slots scheduled yet for this selection.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: SYLLABUS & SUBJECTS ===================== */}
        {activeTab === 'syllabus' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Curriculum & Subject Catalog</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  {subjects.length} registered subjects across MCA 1st & 3rd Semesters
                </p>
              </div>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="glass-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>{showAddForm ? '✕ Close Form' : '+ Add Subject'}</span>
              </button>
            </div>

            {/* Semester Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Semester Filter:</span>
              <button 
                onClick={() => setSubjectSemFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  subjectSemFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                All Subjects ({subjects.length})
              </button>
              <button 
                onClick={() => setSubjectSemFilter(1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  subjectSemFilter === 1
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                1st Semester
              </button>
              <button 
                onClick={() => setSubjectSemFilter(3)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  subjectSemFilter === 3
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                3rd Semester
              </button>
            </div>

            {/* Add Subject Drawer / Form */}
            {showAddForm && (
              <div className="rounded-2xl p-5 sm:p-6 bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-indigo-400">➕</span> Register New Curriculum Subject
                  </h3>
                  <span className="text-xs text-slate-400">Enter code, syllabus modules, and metadata</span>
                </div>
                <form 
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4" 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    try {
                      const formData = new FormData(e.currentTarget as HTMLFormElement);
                      const data = Object.fromEntries(formData.entries());
                      const token = localStorage.getItem('token');
                      const res = await fetch(`${API_URL}/academic/subjects`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify(data)
                      });
                      if (res.ok) {
                        const newSub = await res.json();
                        setSubjects([...subjects, newSub]);
                        (e.target as HTMLFormElement).reset();
                        setShowAddForm(false);
                      } else {
                        alert('Failed to create subject. Please check inputs.');
                      }
                    } catch (err) {
                      alert('Error creating subject');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Subject Code</label>
                    <input 
                      required 
                      name="code" 
                      placeholder="e.g. MCA-101" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Subject Name</label>
                    <input 
                      required 
                      name="name" 
                      placeholder="e.g. Computer Organization & Architecture" 
                      className="glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Semester</label>
                      <select name="semester" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                        <option value="1">1st Sem</option>
                        <option value="2">2nd Sem</option>
                        <option value="3">3rd Sem</option>
                        <option value="4">4th Sem</option>
                        <option value="5">5th Sem</option>
                        <option value="6">6th Sem</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Type</label>
                      <select name="type" className="glass-input rounded-xl px-3 py-2.5 text-sm text-white w-full bg-slate-950 border-white/15">
                        <option value="Theory">Theory</option>
                        <option value="Lab">Lab</option>
                        <option value="Bridge Course">Bridge Course</option>
                        <option value="Elective">Elective</option>
                        <option value="Seminar">Seminar</option>
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Syllabus (Modules & Breakdown)</label>
                    <textarea 
                      name="syllabus" 
                      rows={3}
                      placeholder="• Module 1: Introduction...&#10;• Module 2: Core Concepts..."
                      className="glass-input rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 w-full bg-slate-950/80 border-white/15 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-3 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="py-2.5 px-6 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30"
                    >
                      {submitting ? 'Saving...' : 'Save Subject to Catalog'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Subjects Table */}
            <div className="overflow-x-auto w-full rounded-2xl border border-white/10 bg-slate-950/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3.5 sm:p-4">Code</th>
                    <th className="p-3.5 sm:p-4">Subject Name</th>
                    <th className="p-3.5 sm:p-4">Sem & Type</th>
                    <th className="p-3.5 sm:p-4">Syllabus Breakdown</th>
                    <th className="p-3.5 sm:p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredSubjects.map((subject: any) => (
                    <tr key={subject.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="p-3.5 sm:p-4 font-mono font-bold text-indigo-300 text-xs sm:text-sm">
                        <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                          {subject.code}
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 font-medium text-white">
                        <div>{subject.name}</div>
                        <div className="text-xs text-slate-400 font-normal mt-0.5">
                          {subject.department?.name || 'Department of Computer Applications'}
                        </div>
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {subject.semester && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              Sem {subject.semester}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            {subject.type || 'Theory'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 sm:p-4">
                        {subject.syllabus ? (
                          <button 
                            onClick={() => setViewingSyllabus(subject)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 transition-colors"
                          >
                            <span>📖</span> View Modules
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 italic">No syllabus entered</span>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                        <button 
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 mr-2 transition-colors cursor-pointer"
                          onClick={() => setEditingSubject(subject)}
                        >
                          ✎ Edit
                        </button>
                        <button 
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                          onClick={async () => {
                            if (confirm(`Delete subject ${subject.code} (${subject.name})?`)) {
                              const token = localStorage.getItem('token');
                              await fetch(`${API_URL}/academic/subjects/${subject.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                              setSubjects(subjects.filter((s: any) => s.id !== subject.id));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSubjects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        {loading ? 'Loading registered subjects...' : 'No subjects found for this selection.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: ACADEMIC TERMS ===================== */}
        {activeTab === 'terms' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Academic Terms & Calendars</h2>
                <p className="text-xs sm:text-sm text-slate-400">{terms.length} academic periods configured</p>
              </div>
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="glass-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold self-start sm:self-auto flex items-center gap-1.5"
              >
                <span>{showAddForm ? '✕ Close Form' : '+ Add Term'}</span>
              </button>
            </div>

            {/* Terms Table */}
            <div className="overflow-x-auto w-full rounded-2xl border border-white/10 bg-slate-950/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.04] border-b border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                    <th className="p-3.5 sm:p-4">Term Name</th>
                    <th className="p-3.5 sm:p-4">Academic Year</th>
                    <th className="p-3.5 sm:p-4">Effective Dates</th>
                    <th className="p-3.5 sm:p-4">Status</th>
                    <th className="p-3.5 sm:p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {terms.map((term: any) => (
                    <tr key={term.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="p-3.5 sm:p-4 font-bold text-white text-xs sm:text-sm">
                        {term.name}
                      </td>
                      <td className="p-3.5 sm:p-4 font-mono text-slate-300">
                        {term.year}
                      </td>
                      <td className="p-3.5 sm:p-4 text-xs font-mono text-slate-400">
                        {term.startDate ? new Date(term.startDate).toLocaleDateString() : 'N/A'} - {term.endDate ? new Date(term.endDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        {term.isCurrent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                        <button 
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 mr-2 transition-colors cursor-pointer"
                          onClick={() => setEditingTerm(term)}
                        >
                          ✎ Edit
                        </button>
                        <button 
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                          onClick={async () => {
                            if (confirm(`Delete academic term ${term.name}?`)) {
                              const token = localStorage.getItem('token');
                              await fetch(`${API_URL}/academic/terms/${term.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                              setTerms(terms.filter((t: any) => t.id !== term.id));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ================= VIEW SYLLABUS MODAL ================= */}
      {viewingSyllabus && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {viewingSyllabus.code}
                  </span>
                  {viewingSyllabus.semester && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Semester {viewingSyllabus.semester}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {viewingSyllabus.type || 'Theory'}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white">{viewingSyllabus.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Assam Engineering College • Department of Computer Applications</p>
              </div>
              <button 
                onClick={() => setViewingSyllabus(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <span>📖</span> Official Syllabus & Course Modules
              </h4>
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-white/10 text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {viewingSyllabus.syllabus || 'No syllabus modules entered yet.'}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button 
                onClick={() => setViewingSyllabus(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
              >
                Close Syllabus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT SUBJECT MODAL ================= */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-sky-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✎</span> Edit Subject & Syllabus
              </h3>
              <button onClick={() => setEditingSubject(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_URL}/academic/subjects/${editingSubject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data)
              });
              if (res.ok) {
                const updated = await res.json();
                setSubjects(subjects.map((s) => s.id === updated.id ? updated : s));
                setEditingSubject(null);
              } else {
                alert('Failed to update subject');
              }
              setSubmitting(false);
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Subject Code</label>
                  <input type="text" name="code" defaultValue={editingSubject.code} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Semester</label>
                  <select name="semester" defaultValue={editingSubject.semester || '1'} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs">
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                    <option value="3">3rd Semester</option>
                    <option value="4">4th Semester</option>
                    <option value="5">5th Semester</option>
                    <option value="6">6th Semester</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Subject Name</label>
                <input type="text" name="name" defaultValue={editingSubject.name} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Subject Type</label>
                <select name="type" defaultValue={editingSubject.type || 'Theory'} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs">
                  <option value="Theory">Theory</option>
                  <option value="Lab">Lab</option>
                  <option value="Bridge Course">Bridge Course</option>
                  <option value="Elective">Elective</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Activity">Activity</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Syllabus Modules</label>
                <textarea name="syllabus" defaultValue={editingSubject.syllabus || ''} rows={4} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setEditingSubject(null)} className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT TERM MODAL ================= */}
      {editingTerm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-sky-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✎</span> Edit Academic Term
              </h3>
              <button onClick={() => setEditingTerm(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_URL}/academic/terms/${editingTerm.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data)
              });
              if (res.ok) {
                const updated = await res.json();
                setTerms(terms.map((t) => t.id === updated.id ? updated : t));
                setEditingTerm(null);
              } else {
                alert('Failed to update term');
              }
              setSubmitting(false);
            }} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Term Name</label>
                <input type="text" name="name" defaultValue={editingTerm.name} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Academic Year</label>
                  <input type="number" name="year" defaultValue={editingTerm.year} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" name="isCurrent" id="editIsCurrent" defaultChecked={editingTerm.isCurrent} className="rounded" />
                  <label htmlFor="editIsCurrent" className="text-xs text-slate-300">Active Term</label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Start Date</label>
                  <input type="date" name="startDate" defaultValue={editingTerm.startDate ? new Date(editingTerm.startDate).toISOString().split('T')[0] : ''} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">End Date</label>
                  <input type="date" name="endDate" defaultValue={editingTerm.endDate ? new Date(editingTerm.endDate).toISOString().split('T')[0] : ''} required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setEditingTerm(null)} className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs">Save Term</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT TIMETABLE SLOT MODAL ================= */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-sky-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✎</span> Edit Timetable Class Slot
              </h3>
              <button onClick={() => setEditingSlot(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_URL}/academic/timetable/${editingSlot.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data)
              });
              if (res.ok) {
                const ttRes = await fetch(`${API_URL}/academic/timetable`, { headers: { Authorization: `Bearer ${token}` } });
                if (ttRes.ok) setTimetable(await ttRes.json());
                setEditingSlot(null);
              } else {
                alert('Failed to update timetable slot');
              }
              setSubmitting(false);
            }} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Day of Week</label>
                  <select name="dayOfWeek" defaultValue={editingSlot.dayOfWeek} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs">
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Class Type</label>
                  <select name="subjectType" defaultValue={editingSlot.subjectType} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs">
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                    <option value="Bridge Course">Bridge Course</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Elective">Elective</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Activity">Activity</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Start Time</label>
                  <input type="text" name="startTime" defaultValue={editingSlot.startTime} placeholder="HH:MM" required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">End Time</label>
                  <input type="text" name="endTime" defaultValue={editingSlot.endTime} placeholder="HH:MM" required className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Assigned Section</label>
                <select name="sectionId" defaultValue={editingSlot.sectionId} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white text-xs">
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.subject?.name} - {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setEditingSlot(null)} className="px-3 py-1.5 rounded-xl bg-white/5 text-slate-300 text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-1.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs">Save Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

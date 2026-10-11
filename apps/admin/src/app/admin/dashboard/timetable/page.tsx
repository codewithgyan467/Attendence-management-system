'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

export default function TimetableManagement() {
  const [activeTab, setActiveTab] = useState('syllabus');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
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
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 font-mono pb-12">
      <header className="border-4 border-black p-6 bg-[#ff9900] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl font-black uppercase tracking-tighter">Academic Management</h1>
        <p className="text-xl font-bold mt-2 bg-black text-white inline-block px-2 py-1">TIMETABLE / SYLLABUS / TERMS</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b-4 border-black pb-4">
        <button 
          onClick={() => setActiveTab('syllabus')}
          className={`px-6 py-3 font-bold uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-none ${activeTab === 'syllabus' ? 'bg-black text-white' : 'bg-white text-black'}`}
        >
          Syllabus & Subjects
        </button>
        <button 
          onClick={() => setActiveTab('terms')}
          className={`px-6 py-3 font-bold uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-none ${activeTab === 'terms' ? 'bg-black text-white' : 'bg-white text-black'}`}
        >
          Academic Terms
        </button>
        <button 
          onClick={() => setActiveTab('timetable')}
          className={`px-6 py-3 font-bold uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-none ${activeTab === 'timetable' ? 'bg-black text-white' : 'bg-white text-black'}`}
        >
          Timetable Records
        </button>
      </div>

      {/* Content */}
      <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        {activeTab === 'syllabus' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b-4 border-black pb-4">
              <h2 className="text-2xl font-black uppercase">Subject Management</h2>
              <button className="bg-[#00ffcc] border-2 border-black px-4 py-2 font-bold hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                + NEW SUBJECT
              </button>
            </div>
            <table className="w-full text-left border-collapse border-2 border-black">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-3 border-2 border-black">CODE</th>
                  <th className="p-3 border-2 border-black">SUBJECT NAME</th>
                  <th className="p-3 border-2 border-black">DEPARTMENT</th>
                  <th className="p-3 border-2 border-black">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject: any) => (
                  <tr key={subject.id} className="hover:bg-gray-100">
                    <td className="p-3 border-2 border-black font-bold">{subject.code}</td>
                    <td className="p-3 border-2 border-black">{subject.name}</td>
                    <td className="p-3 border-2 border-black">{subject.department?.name}</td>
                    <td className="p-3 border-2 border-black">
                      <button className="text-xs bg-black text-white px-2 py-1 mr-2" onClick={() => alert('Edit feature coming soon!')}>EDIT</button>
                      <button className="text-xs bg-[#ff3366] text-white px-2 py-1" onClick={async () => {
                        if (confirm(`Delete subject ${subject.code}?`)) {
                          const token = localStorage.getItem('token');
                          await fetch(`${API_URL}/academic/subjects/${subject.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                          setSubjects(subjects.filter((s: any) => s.id !== subject.id));
                        }
                      }}>DEL</button>
                    </td>
                  </tr>
                ))}
                {subjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center font-bold border-2 border-black">LOADING SUBJECTS...</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Basic Add Subject Form */}
            <div className="mt-8 border-4 border-black p-6 bg-gray-100">
              <h3 className="text-xl font-black mb-4">ADD NEW SUBJECT</h3>
              <form className="flex gap-4 items-end flex-wrap" onSubmit={async (e) => {
                e.preventDefault();
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
                } else {
                  alert('Failed to create subject');
                }
              }}>
                <div><label className="block text-xs font-bold">Subject Code</label><input required name="code" placeholder="e.g. CS101" className="border-2 border-black p-2" /></div>
                <div><label className="block text-xs font-bold">Subject Name</label><input required name="name" placeholder="e.g. Data Structures" className="border-2 border-black p-2 w-64" /></div>
                <button type="submit" className="bg-[#ff9900] border-2 border-black px-4 py-2 font-bold hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  ADD SUBJECT
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b-4 border-black pb-4">
              <h2 className="text-2xl font-black uppercase">Academic Terms</h2>
              <button className="bg-[#00ffcc] border-2 border-black px-4 py-2 font-bold hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                + NEW TERM
              </button>
            </div>
            <table className="w-full text-left border-collapse border-2 border-black">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-3 border-2 border-black">TERM NAME</th>
                  <th className="p-3 border-2 border-black">YEAR</th>
                  <th className="p-3 border-2 border-black">STATUS</th>
                  <th className="p-3 border-2 border-black">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {terms.map((term: any) => (
                  <tr key={term.id} className={term.isCurrent ? 'bg-[#ffff00]' : 'hover:bg-gray-100 opacity-60'}>
                    <td className="p-3 border-2 border-black font-bold">{term.name}</td>
                    <td className="p-3 border-2 border-black">{term.year}</td>
                    <td className="p-3 border-2 border-black font-black uppercase tracking-wider">{term.isCurrent ? 'ACTIVE' : 'COMPLETED'}</td>
                    <td className="p-3 border-2 border-black">
                      <button className="text-xs bg-black text-white px-2 py-1 mr-2" onClick={() => alert('Edit feature coming soon!')}>EDIT</button>
                      <button className="text-xs bg-[#ff3366] text-white px-2 py-1" onClick={async () => {
                        if (confirm(`Delete term ${term.name}?`)) {
                          const token = localStorage.getItem('token');
                          await fetch(`${API_URL}/academic/terms/${term.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                          setTerms(terms.filter((t: any) => t.id !== term.id));
                        }
                      }}>DEL</button>
                    </td>
                  </tr>
                ))}
                {terms.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center font-bold border-2 border-black">LOADING TERMS...</td></tr>
                )}
              </tbody>
            </table>
            
            {/* Basic Add Term Form */}
            <div className="mt-8 border-4 border-black p-6 bg-gray-100">
              <h3 className="text-xl font-black mb-4">ADD NEW TERM</h3>
              <form className="flex gap-4 items-end flex-wrap" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget as HTMLFormElement);
                const data = Object.fromEntries(formData.entries());
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/academic/terms`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify(data)
                });
                if (res.ok) {
                  const newTerm = await res.json();
                  setTerms([...terms, newTerm]);
                  (e.target as HTMLFormElement).reset();
                } else {
                  alert('Failed to create term');
                }
              }}>
                <div><label className="block text-xs font-bold">Term Name</label><input required name="name" placeholder="e.g. Fall 2026" className="border-2 border-black p-2" /></div>
                <div><label className="block text-xs font-bold">Year</label><input required type="number" name="year" defaultValue={2026} className="border-2 border-black p-2 w-24" /></div>
                <div><label className="block text-xs font-bold">Start Date</label><input required type="date" name="startDate" className="border-2 border-black p-2" /></div>
                <div><label className="block text-xs font-bold">End Date</label><input required type="date" name="endDate" className="border-2 border-black p-2" /></div>
                <div>
                  <label className="block text-xs font-bold">Current Term</label>
                  <input type="checkbox" name="isCurrent" className="border-2 border-black w-6 h-6 ml-2" />
                </div>
                <button type="submit" className="bg-[#ff9900] border-2 border-black px-4 py-2 font-bold hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  ADD TERM
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'timetable' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b-4 border-black pb-4">
              <h2 className="text-2xl font-black uppercase">Timetable Records</h2>
              <button className="bg-[#00ffcc] border-2 border-black px-4 py-2 font-bold hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                + ADD SLOT
              </button>
            </div>
            <table className="w-full text-left border-collapse border-2 border-black">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-3 border-2 border-black">DAY</th>
                  <th className="p-3 border-2 border-black">TIME</th>
                  <th className="p-3 border-2 border-black">TERM & SECTION</th>
                  <th className="p-3 border-2 border-black">SUBJECT / TYPE</th>
                  <th className="p-3 border-2 border-black">CLASSROOM</th>
                  <th className="p-3 border-2 border-black">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((tt: any) => {
                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return (
                    <tr key={tt.id} className="hover:bg-gray-100">
                      <td className="p-3 border-2 border-black font-bold uppercase">{days[tt.dayOfWeek]}</td>
                      <td className="p-3 border-2 border-black">{tt.startTime} - {tt.endTime}</td>
                      <td className="p-3 border-2 border-black">{tt.academicTerm?.name.split(' (')[0]} <br/><span className="text-xs">{tt.section?.name}</span></td>
                      <td className="p-3 border-2 border-black">{tt.section?.subject?.name} <br/><span className="text-xs font-bold bg-[#00ffcc] px-1">{tt.subjectType}</span></td>
                      <td className="p-3 border-2 border-black">{tt.classroom?.name}</td>
                      <td className="p-3 border-2 border-black">
                        <button className="text-xs bg-black text-white px-2 py-1 mr-2" onClick={() => alert('Edit feature coming soon!')}>EDIT</button>
                        <button className="text-xs bg-[#ff3366] text-white px-2 py-1" onClick={async () => {
                          if (confirm(`Delete slot ${tt.subjectType} - ${tt.startTime}?`)) {
                            const token = localStorage.getItem('token');
                            await fetch(`${API_URL}/academic/timetable/${tt.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                            setTimetable(timetable.filter((t: any) => t.id !== tt.id));
                          }
                        }}>DEL</button>
                      </td>
                    </tr>
                  )
                })}
                {timetable.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center font-bold border-2 border-black">LOADING TIMETABLE...</td></tr>
                )}
              </tbody>
            </table>
            
            {/* Basic Add Timetable Slot Form */}
            <div className="mt-8 border-4 border-black p-6 bg-gray-100">
              <h3 className="text-xl font-black mb-4">ADD NEW SLOT</h3>
              <form className="flex gap-4 items-end flex-wrap" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget as HTMLFormElement);
                const data = Object.fromEntries(formData.entries());
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/academic/timetable`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify(data)
                });
                if (res.ok) {
                  const newSlot = await res.json();
                  const completeSlot = {
                    ...newSlot,
                    academicTerm: terms.find((t: any) => t.id === newSlot.academicTermId),
                    section: sections.find((s: any) => s.id === newSlot.sectionId),
                    classroom: classrooms.find((c: any) => c.id === newSlot.classroomId)
                  };
                  setTimetable([...timetable, completeSlot]);
                  (e.target as HTMLFormElement).reset();
                } else {
                  alert('Failed to create slot');
                }
              }}>
                <div>
                  <label className="block text-xs font-bold">Term</label>
                  <select required name="academicTermId" className="border-2 border-black p-2 max-w-xs">
                    <option value="">Select Term</option>
                    {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold">Section / Subject</label>
                  <select required name="sectionId" className="border-2 border-black p-2 max-w-xs">
                    <option value="">Select Section</option>
                    {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name} - {s.subject?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold">Classroom</label>
                  <select required name="classroomId" className="border-2 border-black p-2 max-w-xs">
                    <option value="">Select Classroom</option>
                    {classrooms.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold">Day</label>
                  <select required name="dayOfWeek" className="border-2 border-black p-2">
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                    <option value="0">Sunday</option>
                  </select>
                </div>
                <div><label className="block text-xs font-bold">Start Time</label><input required type="time" name="startTime" className="border-2 border-black p-2" /></div>
                <div><label className="block text-xs font-bold">End Time</label><input required type="time" name="endTime" className="border-2 border-black p-2" /></div>
                <div>
                  <label className="block text-xs font-bold">Type</label>
                  <select required name="subjectType" className="border-2 border-black p-2">
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab</option>
                    <option value="Tutorial">Tutorial</option>
                  </select>
                </div>
                <button type="submit" className="bg-[#ff9900] border-2 border-black px-4 py-2 font-bold hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  ADD SLOT
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

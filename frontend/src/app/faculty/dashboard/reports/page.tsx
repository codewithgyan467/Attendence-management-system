'use client';

import AttendanceRegisterView from '@/components/AttendanceRegisterView';

export default function FacultyReportsPage() {
  return (
    <div className="py-2">
      <AttendanceRegisterView isAdmin={false} />
    </div>
  );
}

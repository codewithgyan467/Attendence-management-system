'use client';

import AttendanceRegisterView from '@/components/AttendanceRegisterView';

export default function AdminReportsPage() {
  return (
    <div className="py-2">
      <AttendanceRegisterView isAdmin={true} />
    </div>
  );
}

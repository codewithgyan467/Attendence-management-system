'use client';

import { useState, useEffect } from 'react';

interface ClockWidgetProps {
  scheduleData?: {
    active: boolean;
    isHoliday?: boolean;
    holiday?: { title: string; description?: string; date: string };
    timeRemainingSeconds?: number;
    slot?: {
      startTime: string;
      endTime: string;
      subject: string;
      code: string;
      type: string;
      classroom: string;
      term: string;
    } | null;
    nextSlot?: {
      startTime: string;
      endTime: string;
      subject: string;
      code: string;
      type: string;
      classroom: string;
      term: string;
    } | null;
    message?: string;
    clockSource?: string;
  } | null;
  onSimulationChange?: (simDay: number | null, simTime: string | null) => void;
  selectedSimulation?: string;
}

export default function ClockWidget({ scheduleData, onSimulationChange, selectedSimulation = 'live' }: ClockWidgetProps) {
  const [time, setTime] = useState<Date | null>(null);
  const [remaining, setRemaining] = useState<number>(scheduleData?.timeRemainingSeconds || 0);

  useEffect(() => {
    if (scheduleData?.timeRemainingSeconds !== undefined) {
      setRemaining(scheduleData.timeRemainingSeconds);
    }
  }, [scheduleData?.timeRemainingSeconds]);

  // Tick every second on client mount
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = time ? days[time.getDay()] : 'Loading Day...';
  const dateFormatted = time ? time.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : 'Loading Date...';
  const timeFormatted = time ? time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }) : '--:--:--';

  return (
    <div className="card shadow-sm border-0 mb-4 bg-white">
      <div className="card-body p-4">
        {/* Top Bar: Calendar date, live clock, status pill */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 pb-3 mb-3 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-3 bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center fs-4">
              📅
            </div>
            <div>
              <div className="text-muted small text-uppercase fw-semibold d-flex align-items-center gap-2">
                <span>{dayName}</span>
                <span>•</span>
                <span>{dateFormatted}</span>
              </div>
              <div className="fs-4 font-monospace fw-bold text-dark">
                {timeFormatted} <span className="fs-6 text-muted fw-normal">IST</span>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="badge bg-light text-secondary border">
              <span className="d-inline-block rounded-circle bg-success me-1.5" style={{ width: '8px', height: '8px' }}></span>
              Sync: {scheduleData?.clockSource || 'Authoritative Server'}
            </span>

            {/* Quick Simulation dropdown for testing Routine Slots */}
            {onSimulationChange && (
              <select
                value={selectedSimulation}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'live') {
                    onSimulationChange(null, null);
                  } else if (val === 'tue-os') {
                    onSimulationChange(2, '08:15'); // Tuesday 8:15 AM OS
                  } else if (val === 'tue-lab') {
                    onSimulationChange(2, '09:30'); // Tuesday 9:30 AM Lab
                  } else if (val === 'wed-coa') {
                    onSimulationChange(3, '11:15'); // Wednesday 11:15 AM COA
                  } else if (val === 'fri-os') {
                    onSimulationChange(5, '14:20'); // Friday 2:20 PM OS
                  }
                }}
                className="form-select form-select-sm text-secondary bg-light border"
                style={{ width: 'auto', minWidth: '180px' }}
              >
                <option value="live">⚡ Real-Time IST Clock</option>
                <option value="tue-os">🧪 Test: Tue 8-9am OS (Sem 1)</option>
                <option value="tue-lab">🧪 Test: Tue 9-11am Lab (Sem 1)</option>
                <option value="wed-coa">🧪 Test: Wed 11-12pm COA (Sem 1)</option>
                <option value="fri-os">🧪 Test: Fri 2-3pm OS (Sem 1)</option>
              </select>
            )}
          </div>
        </div>

        {/* Routine Session Window Banner */}
        {scheduleData?.isHoliday ? (
          <div className="alert alert-warning border-warning-subtle mb-0" role="alert">
            <div className="fw-bold mb-1">
              🎉 Institutional Holiday: {scheduleData.holiday?.title}
            </div>
            <div className="small">
              Regular class attendance is suspended today. Only the Administrator has override access.
            </div>
          </div>
        ) : scheduleData?.active && scheduleData?.slot ? (
          <div className="p-3 rounded-3 bg-primary-subtle border border-primary-subtle d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3">
            <div>
              <div className="badge bg-success mb-2">
                ● Live Attendance Window Open
              </div>
              <h5 className="fw-bold text-dark mb-1">
                {scheduleData.slot.subject} ({scheduleData.slot.code})
              </h5>
              <div className="text-muted small">
                Slot: {scheduleData.slot.startTime} — {scheduleData.slot.endTime} • Room: {scheduleData.slot.classroom} • Type: {scheduleData.slot.type}
              </div>
            </div>

            <div className="bg-white p-3 rounded-3 border text-start text-sm-end shrink-0">
              <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '11px', display: 'block' }}>
                Time Remaining in Slot:
              </span>
              <span className="fs-5 font-monospace fw-bold text-primary">
                ⏳ {formatSeconds(remaining)}
              </span>
              <span className="text-muted" style={{ fontSize: '11px', display: 'block' }}>
                Closes strictly at {scheduleData.slot.endTime}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-3 bg-light border d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
            <div className="d-flex align-items-center gap-2 text-muted small">
              <span className="fs-5">⏳</span>
              <span>No lecture session active at this moment. The window unlocks during scheduled routine hours.</span>
            </div>
            {scheduleData?.nextSlot && (
              <span className="badge bg-light text-primary border font-monospace">
                Next: {scheduleData.nextSlot.startTime} — {scheduleData.nextSlot.subject}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

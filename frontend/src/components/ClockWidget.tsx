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
    <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/10 space-y-4">
      {/* Top Bar: Calendar date, live clock, status pill */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-xl">
            🗓️
          </div>
          <div>
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
              <span>{dayName}</span>
              <span className="w-1 h-1 rounded-full bg-slate-500"></span>
              <span>{dateFormatted}</span>
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-white tracking-tight">
              {timeFormatted} <span className="text-xs font-normal text-indigo-300">IST</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-white/5 border border-white/10 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Sync: {scheduleData?.clockSource || 'WorldTime API'}
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
              className="text-[11px] sm:text-xs bg-slate-900 border border-indigo-500/30 rounded-xl px-2.5 py-1 text-indigo-200 font-medium cursor-pointer"
            >
              <option value="live">⚡ Live Real Clock</option>
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
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span>🎉</span>
            <span>Institutional Holiday: {scheduleData.holiday?.title}</span>
          </div>
          <p className="text-xs text-amber-300/80">
            Regular class attendance is suspended today. Only the Administrator has override access.
          </p>
        </div>
      ) : scheduleData?.active && scheduleData?.slot ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-900/80 border border-indigo-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Current Attendance Session Open
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {scheduleData.slot.subject} ({scheduleData.slot.code})
            </h3>
            <p className="text-xs text-slate-300">
              {scheduleData.slot.term} • Room: {scheduleData.slot.classroom} • Type: {scheduleData.slot.type}
            </p>
          </div>

          <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-indigo-500/30 text-left sm:text-right w-full sm:w-auto shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Time Remaining in Slot:
            </span>
            <span className="text-lg sm:text-xl font-mono font-extrabold text-indigo-300">
              ⏳ {formatSeconds(remaining)}
            </span>
            <span className="text-[11px] text-slate-400 block -mt-0.5">
              Closes strictly at {scheduleData.slot.endTime}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-base">⏳</span>
            <span>No lecture active right now. Attendance window will unlock at the next scheduled routine period.</span>
          </div>
          {scheduleData?.nextSlot && (
            <div className="font-mono text-indigo-300 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 whitespace-nowrap">
              Next: {scheduleData.nextSlot.startTime} — {scheduleData.nextSlot.subject}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Attendance } from '../../lib/types';
import { Card } from '../ui/Card';

interface AttendanceMetricsSummaryProps {
  records?: Attendance[];
}

export const AttendanceMetricsSummary: React.FC<AttendanceMetricsSummaryProps> = ({ records = [] }) => {
  const total = records.length;
  const present = records.filter((a) => a.status === 'PRESENT' && !a.late).length;
  const late = records.filter((a) => a.late).length;
  const completed = records.filter((a) => a.status === 'COMPLETED').length;
  const absent = records.filter((a) => a.status === 'ABSENT').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      <Card compact className="space-y-1 border border-[#262c38] bg-[#11141a]" chamfer>
        <span className="text-[10px] font-mono font-bold text-[#606c80] uppercase tracking-wider block">
          TOTAL LOGGED
        </span>
        <div className="text-2xl font-bold font-mono tabular-nums text-white">
          {total}
        </div>
      </Card>

      <Card compact className="space-y-1 border border-[#262c38] bg-[#11141a] border-l-2 border-l-[#00e676]" chamfer>
        <span className="text-[10px] font-mono font-bold text-[#00e676] uppercase tracking-wider block">
          PRESENT (ON-TIME)
        </span>
        <div className="text-2xl font-bold font-mono tabular-nums text-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.2)]">
          {present}
        </div>
      </Card>

      <Card compact className="space-y-1 border border-[#262c38] bg-[#11141a] border-l-2 border-l-[#ff6b00]" chamfer>
        <span className="text-[10px] font-mono font-bold text-[#ff6b00] uppercase tracking-wider block">
          LATE ARRIVALS
        </span>
        <div className="text-2xl font-bold font-mono tabular-nums text-[#ff6b00]">
          {late}
        </div>
      </Card>

      <Card compact className="space-y-1 border border-[#262c38] bg-[#11141a] border-l-2 border-l-[#00f0ff]" chamfer>
        <span className="text-[10px] font-mono font-bold text-[#00f0ff] uppercase tracking-wider block">
          COMPLETED SHIFTS
        </span>
        <div className="text-2xl font-bold font-mono tabular-nums text-[#00f0ff]">
          {completed}
        </div>
      </Card>

      <Card compact className="space-y-1 border border-[#262c38] bg-[#11141a] border-l-2 border-l-[#ff1744]" chamfer>
        <span className="text-[10px] font-mono font-bold text-[#ff1744] uppercase tracking-wider block">
          ABSENT EXCEPTIONS
        </span>
        <div className="text-2xl font-bold font-mono tabular-nums text-[#ff335c]">
          {absent}
        </div>
      </Card>
    </div>
  );
};

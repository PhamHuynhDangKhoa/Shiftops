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
      <Card compact className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider block">
          Total Records
        </span>
        <div className="text-xl font-bold font-mono tabular-nums text-zinc-950">
          {total}
        </div>
      </Card>

      <Card compact className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-emerald-700 uppercase tracking-wider block">
          Present (On-Time)
        </span>
        <div className="text-xl font-bold font-mono tabular-nums text-emerald-800">
          {present}
        </div>
      </Card>

      <Card compact className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-amber-700 uppercase tracking-wider block">
          Late Arrivals
        </span>
        <div className="text-xl font-bold font-mono tabular-nums text-amber-800">
          {late}
        </div>
      </Card>

      <Card compact className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-zinc-600 uppercase tracking-wider block">
          Completed
        </span>
        <div className="text-xl font-bold font-mono tabular-nums text-zinc-800">
          {completed}
        </div>
      </Card>

      <Card compact className="space-y-1">
        <span className="text-[11px] font-mono font-medium text-rose-700 uppercase tracking-wider block">
          Absent
        </span>
        <div className="text-xl font-bold font-mono tabular-nums text-rose-800">
          {absent}
        </div>
      </Card>
    </div>
  );
};

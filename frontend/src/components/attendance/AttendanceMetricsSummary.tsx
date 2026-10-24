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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-5">
      <Card compact className="space-y-1">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">
          Total Logged
        </span>
        <div className="text-2xl font-bold text-zinc-900 tabular-nums">
          {total}
        </div>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">
            On-Time
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <div className="text-2xl font-bold text-emerald-600 tabular-nums">
          {present}
        </div>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">
            Late
          </span>
          <span className="w-2 h-2 rounded-full bg-amber-500" />
        </div>
        <div className="text-2xl font-bold text-amber-600 tabular-nums">
          {late}
        </div>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">
            Completed
          </span>
          <span className="w-2 h-2 rounded-full bg-blue-500" />
        </div>
        <div className="text-2xl font-bold text-blue-600 tabular-nums">
          {completed}
        </div>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block">
            Absent
          </span>
          <span className="w-2 h-2 rounded-full bg-rose-500" />
        </div>
        <div className="text-2xl font-bold text-rose-600 tabular-nums">
          {absent}
        </div>
      </Card>
    </div>
  );
};

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
        <span className="text-xs font-medium text-[#5d5f60] block">
          Total logged
        </span>
        <div className="text-2xl font-normal text-[#131416] tabular-nums">
          {total}
        </div>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#5d5f60] block">
            On time
          </span>
          <span className="w-2 h-2 rounded-full bg-[#1e7b4f]" />
        </div>
        <div className="text-2xl font-normal text-[#1e7b4f] tabular-nums">
          {present}
        </div>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#5d5f60] block">
            Late
          </span>
          <span className="w-2 h-2 rounded-full bg-[#92400e]" />
        </div>
        <div className="text-2xl font-normal text-[#92400e] tabular-nums">
          {late}
        </div>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#5d5f60] block">
            Completed
          </span>
          <span className="w-2 h-2 rounded-full bg-[#1b6c80]" />
        </div>
        <div className="text-2xl font-normal text-[#131416] tabular-nums">
          {completed}
        </div>
      </Card>

      <Card compact className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#5d5f60] block">
            Absent
          </span>
          <span className="w-2 h-2 rounded-full bg-[#c4242a]" />
        </div>
        <div className="text-2xl font-normal text-[#c4242a] tabular-nums">
          {absent}
        </div>
      </Card>
    </div>
  );
};

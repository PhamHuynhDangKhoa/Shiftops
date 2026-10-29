import React from 'react';
import { Attendance } from '../../lib/types';

interface ManagerCoverageBannerProps {
  records: Attendance[];
  branchName?: string;
  onSelectStatusFilter?: (status: string) => void;
  activeStatusFilter?: string;
}

export const ManagerCoverageBanner: React.FC<ManagerCoverageBannerProps> = ({
  records = [],
  branchName = 'Shibuya Flagship',
  onSelectStatusFilter,
  activeStatusFilter = 'ALL',
}) => {
  const total = records.length;
  const presentOnFloor = records.filter(
    (a) => (a.status === 'PRESENT' || a.status === 'LATE') && !a.checkOutAt
  ).length;
  const completed = records.filter((a) => a.status === 'COMPLETED').length;
  const lateCount = records.filter((a) => a.late).length;
  const absentCount = records.filter((a) => a.status === 'ABSENT').length;

  const activeStaffTotal = Math.max(total, 1);
  const accountedFor = presentOnFloor + completed;
  const coveragePercent = Math.min(
    100,
    Math.round((accountedFor / activeStaffTotal) * 100)
  );

  return (
    <div className="rounded-xl border border-[#e8eaec] bg-white p-5 mb-5 text-left">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Floor Coverage Meter */}
        <div className="space-y-2 flex-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#1b6c80]">
              Live Store Operations &amp; Headcount
            </span>
            <span className="text-xs font-mono text-[#5d5f60] bg-[#f4f6f8] px-2 py-0.5 rounded border border-[#e8eaec]">
              {branchName}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-semibold text-[#131416]">
            Active Sales Floor Coverage: {presentOnFloor} Staff on Floor
          </h2>

          <p className="text-[13px] text-[#5d5f60] font-mono tabular-nums">
            {accountedFor} of {total} rostered shifts accounted for ({coveragePercent}% operational fulfillment)
          </p>

          {/* Progress Hairline */}
          <div className="w-full max-w-md h-2 rounded-full bg-[#f0f1f2] overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${
                coveragePercent >= 80
                  ? 'bg-[#1e7b4f]'
                  : coveragePercent >= 50
                  ? 'bg-[#d97706]'
                  : 'bg-[#c4242a]'
              }`}
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
        </div>

        {/* Right: Operational Exception Triage Badges */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {lateCount > 0 && (
            <button
              type="button"
              onClick={() => onSelectStatusFilter?.('LATE')}
              className={`h-9 px-3.5 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeStatusFilter === 'LATE'
                  ? 'bg-[#fef3c7] text-[#92400e] border-[#d97706]/40 font-semibold'
                  : 'bg-white text-[#92400e] border-[#d97706]/30 hover:bg-[#fef3c7]/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#d97706]" />
              <span>
                {lateCount} tardy arrival{lateCount > 1 ? 's' : ''} flagged →
              </span>
            </button>
          )}

          {absentCount > 0 && (
            <button
              type="button"
              onClick={() => onSelectStatusFilter?.('ABSENT')}
              className={`h-9 px-3.5 rounded-lg border text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeStatusFilter === 'ABSENT'
                  ? 'bg-[#ffedea] text-[#831c1e] border-[#c4242a]/40 font-semibold'
                  : 'bg-white text-[#831c1e] border-[#c4242a]/30 hover:bg-[#ffedea]/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#c4242a]" />
              <span>
                {absentCount} absence{absentCount > 1 ? 's' : ''} marked →
              </span>
            </button>
          )}

          {lateCount === 0 && absentCount === 0 && (
            <div className="h-9 px-3.5 rounded-lg bg-[#dcfae5] border border-[#1e7b4f]/25 text-[#04250e] text-[13px] font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1e7b4f]" />
              <span>Full Roster Compliance · Zero Delays</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

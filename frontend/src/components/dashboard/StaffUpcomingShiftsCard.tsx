import React from 'react';
import { Link } from 'react-router-dom';
import { Shift } from '../../lib/types';
import { IconClock, IconArrowUpRight } from '../ui/Icons';

export interface StaffUpcomingShiftsCardProps {
  shifts?: Shift[];
}

export const StaffUpcomingShiftsCard: React.FC<StaffUpcomingShiftsCardProps> = ({
  shifts,
}) => {
  const upcomingList = shifts && shifts.length > 1 ? shifts.slice(1, 4) : [];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconClock size={18} className="text-[#131416]" />
          <h3 className="text-base font-bold text-[#131416]">
            Upcoming Shifts This Week
          </h3>
        </div>
        <Link
          to="/shifts"
          className="text-xs font-medium text-[#1b6c80] hover:text-[#155464] flex items-center gap-1 transition-colors"
        >
          <span>View Full Roster</span>
          <IconArrowUpRight size={11} />
        </Link>
      </div>

      <div>
        {upcomingList.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#64748b] leading-relaxed">
            No other shifts scheduled for this week. Check the roster for upcoming assignments.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {upcomingList.map((shift) => (
              <div
                key={shift.id}
                className="p-4 rounded-xl bg-[#f8f9fa] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#131416]">
                    {shift.name || 'Shift'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e2e8f0] text-[#334155]">
                    {new Date(shift.startTime).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="text-xs text-[#64748b] flex items-center gap-1.5">
                  <IconClock size={13} className="text-[#94a3b8]" />
                  <span className="font-sans tabular-nums">
                    {new Date(shift.startTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    –{' '}
                    {new Date(shift.endTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

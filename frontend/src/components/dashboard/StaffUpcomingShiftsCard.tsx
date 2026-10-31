import React from 'react';
import { Link } from 'react-router-dom';
import { Shift } from '../../lib/types';
import { IconClock, IconArrowUpRight } from '../ui/Icons';

export interface StaffUpcomingShiftsCardProps {
  shifts?: Shift[];
  layoutMode?: 'stack' | 'grid';
}

export const StaffUpcomingShiftsCard: React.FC<StaffUpcomingShiftsCardProps> = ({
  shifts,
  layoutMode = 'stack',
}) => {
  const upcomingList = shifts && shifts.length > 0 ? shifts : [];

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconClock size={16} className="text-[#131416]" />
          <h3 className="text-sm sm:text-base font-bold text-[#131416]">
            Upcoming Shifts
          </h3>
        </div>
        <Link
          to="/shifts"
          className="text-xs sm:text-sm font-medium text-[#131416] hover:underline flex items-center gap-1 transition-colors"
        >
          <span>Full Roster</span>
          <IconArrowUpRight size={11} />
        </Link>
      </div>

      {upcomingList.length === 0 ? (
        <div className="py-5 text-center text-xs sm:text-sm text-[#475569] leading-relaxed bg-[#f8f9fa] rounded-lg">
          No other shifts scheduled for this week.
        </div>
      ) : layoutMode === 'stack' ? (
        /* Vertical Stack for Right Console */
        <div className="space-y-2">
          {upcomingList.map((shift) => (
            <div
              key={shift.id}
              className="p-3 rounded-lg bg-[#f8f9fa] space-y-1 hover:bg-[#f1f5f9] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-[#131416]">
                  {new Date(shift.startTime).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="text-xs sm:text-sm text-[#475569] font-medium font-sans tabular-nums">
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
              <span className="text-xs sm:text-sm text-[#475569] block">
                {shift.name || 'Floor Shift'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Mobile scroll / grid */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {upcomingList.map((shift) => (
            <div
              key={shift.id}
              className="p-3 rounded-lg bg-[#f8f9fa] space-y-1"
            >
              <span className="text-xs sm:text-sm font-semibold text-[#131416] block">
                {new Date(shift.startTime).toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="text-xs sm:text-sm text-[#475569] block">
                {shift.name || 'Floor Shift'}
              </span>
              <span className="text-xs sm:text-sm text-[#475569] font-sans tabular-nums block">
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
          ))}
        </div>
      )}
    </div>
  );
};

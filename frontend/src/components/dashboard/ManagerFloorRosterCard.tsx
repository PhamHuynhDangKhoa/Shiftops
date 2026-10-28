import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Attendance } from '../../lib/types';

export interface ManagerFloorRosterCardProps {
  branchAttendance?: Attendance[];
}

interface RosterDisplayItem {
  id: string;
  userName: string;
  roleTitle: string;
  shiftWindow: string;
  clockInTime: string;
  clockOutTime: string;
  status: 'PRESENT' | 'LATE' | 'PENDING' | 'COMPLETED';
  isLate: boolean;
  lateDelta?: string;
}

const DEFAULT_FLOOR_ROSTER: RosterDisplayItem[] = [
  {
    id: 'att-1',
    userName: 'Marcus Tanaka',
    roleTitle: 'Shift Supervisor',
    shiftWindow: '08:00 – 16:30',
    clockInTime: '07:54',
    clockOutTime: '—',
    status: 'PRESENT',
    isLate: false,
  },
  {
    id: 'att-2',
    userName: 'Aoi Mori',
    roleTitle: 'Barista Lead',
    shiftWindow: '08:00 – 16:30',
    clockInTime: '07:58',
    clockOutTime: '—',
    status: 'PRESENT',
    isLate: false,
  },
  {
    id: 'att-3',
    userName: 'Daiki Takahashi',
    roleTitle: 'Line Barista',
    shiftWindow: '08:30 – 16:30',
    clockInTime: '08:44',
    clockOutTime: '—',
    status: 'LATE',
    isLate: true,
    lateDelta: '+14m',
  },
  {
    id: 'att-4',
    userName: 'Hana Endo',
    roleTitle: 'Cashier & Service',
    shiftWindow: '08:30 – 16:30',
    clockInTime: '08:26',
    clockOutTime: '—',
    status: 'PRESENT',
    isLate: false,
  },
  {
    id: 'att-5',
    userName: 'Ren Ito',
    roleTitle: 'Floor Operations',
    shiftWindow: '09:00 – 17:00',
    clockInTime: '08:55',
    clockOutTime: '—',
    status: 'PRESENT',
    isLate: false,
  },
  {
    id: 'att-6',
    userName: 'Yuka Suzuki',
    roleTitle: 'Kitchen Prep',
    shiftWindow: '09:00 – 17:00',
    clockInTime: '08:58',
    clockOutTime: '—',
    status: 'PRESENT',
    isLate: false,
  },
  {
    id: 'att-7',
    userName: 'Kenji Sato',
    roleTitle: 'Cashier (Afternoon)',
    shiftWindow: '14:00 – 22:30',
    clockInTime: '—',
    clockOutTime: '—',
    status: 'PENDING',
    isLate: false,
  },
];

export const ManagerFloorRosterCard: React.FC<ManagerFloorRosterCardProps> = ({
  branchAttendance,
}) => {
  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'PRESENT' | 'LATE' | 'PENDING'
  >('ALL');

  const items: RosterDisplayItem[] = useMemo(() => {
    if (branchAttendance && branchAttendance.length > 0) {
      return branchAttendance.map((a) => {
        let displayStatus: 'PRESENT' | 'LATE' | 'PENDING' | 'COMPLETED' =
          a.status === 'COMPLETED'
            ? 'COMPLETED'
            : a.status === 'LATE'
            ? 'LATE'
            : a.status === 'PRESENT'
            ? 'PRESENT'
            : 'PENDING';

        const inTime = a.checkInAt
          ? new Date(a.checkInAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—';

        const outTime = a.checkOutAt
          ? new Date(a.checkOutAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—';

        const shiftWindow =
          a.shiftStartTime && a.shiftEndTime
            ? `${new Date(a.shiftStartTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })} – ${new Date(a.shiftEndTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : '08:00 – 16:30';

        return {
          id: a.id,
          userName: a.userName,
          roleTitle: a.shiftName || 'Floor Staff',
          shiftWindow,
          clockInTime: inTime,
          clockOutTime: outTime,
          status: displayStatus,
          isLate: a.late,
          lateDelta: a.late ? '+14m' : undefined,
        };
      });
    }
    return DEFAULT_FLOOR_ROSTER;
  }, [branchAttendance]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'ALL') return items;
    if (activeFilter === 'PRESENT')
      return items.filter((i) => i.status === 'PRESENT');
    if (activeFilter === 'LATE') return items.filter((i) => i.status === 'LATE');
    if (activeFilter === 'PENDING')
      return items.filter((i) => i.status === 'PENDING');
    return items;
  }, [items, activeFilter]);

  const countPresent = items.filter((i) => i.status === 'PRESENT').length;
  const countLate = items.filter((i) => i.status === 'LATE').length;
  const countPending = items.filter((i) => i.status === 'PENDING').length;

  return (
    <div className="rounded-xl bg-white border border-[#e8eaec] p-5">
      {/* Title & Link */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h2 className="text-base font-semibold text-[#131416]">
            Floor Attendance Roster
          </h2>
          <p className="text-xs text-[#5d5f60] mt-0.5">
            {items.length} assigned personnel across today&apos;s shift coverage
          </p>
        </div>
        <Link
          to="/attendance"
          className="text-xs text-[#1b6c80] hover:text-[#155464] font-medium transition-colors"
        >
          Attendance log →
        </Link>
      </div>

      {/* Filter Underline Tabs on 1px Rule */}
      <div className="flex items-center gap-4 border-b border-[#f0f1f2] text-[13px] font-medium text-[#5d5f60] mb-3">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`pb-2 transition-colors cursor-pointer relative ${
            activeFilter === 'ALL'
              ? 'text-[#131416] font-semibold'
              : 'hover:text-[#131416]'
          }`}
        >
          All on shift ({items.length})
          {activeFilter === 'ALL' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#131416]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('PRESENT')}
          className={`pb-2 transition-colors cursor-pointer relative ${
            activeFilter === 'PRESENT'
              ? 'text-[#131416] font-semibold'
              : 'hover:text-[#131416]'
          }`}
        >
          Present ({countPresent})
          {activeFilter === 'PRESENT' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#131416]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('LATE')}
          className={`pb-2 transition-colors cursor-pointer relative ${
            activeFilter === 'LATE'
              ? 'text-[#131416] font-semibold'
              : 'hover:text-[#131416]'
          }`}
        >
          Late ({countLate})
          {activeFilter === 'LATE' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#131416]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('PENDING')}
          className={`pb-2 transition-colors cursor-pointer relative ${
            activeFilter === 'PENDING'
              ? 'text-[#131416] font-semibold'
              : 'hover:text-[#131416]'
          }`}
        >
          Pending ({countPending})
          {activeFilter === 'PENDING' && (
            <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#131416]" />
          )}
        </button>
      </div>

      {/* Roster Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-[#f0f1f2] text-[#5d5f60] font-normal text-xs">
              <th className="py-2.5 pr-3 font-normal">Staff member</th>
              <th className="py-2.5 px-3 font-normal">Role</th>
              <th className="py-2.5 px-3 font-normal">Scheduled</th>
              <th className="py-2.5 px-3 font-normal">Clock-in</th>
              <th className="py-2.5 pl-3 text-right font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f1f2]">
            {filteredItems.map((item) => (
              <tr
                key={item.id}
                className="h-12 hover:bg-[#f9fbfc] transition-colors"
              >
                <td className="py-2.5 pr-3">
                  <span className="font-medium text-[#131416] block text-sm">
                    {item.userName}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-[#5d5f60] text-[13px]">
                  {item.roleTitle}
                </td>
                <td className="py-2.5 px-3 text-[#5d5f60] font-mono tabular-nums text-xs">
                  {item.shiftWindow}
                </td>
                <td className="py-2.5 px-3 font-mono tabular-nums text-[#131416] text-[13px]">
                  {item.clockInTime}
                  {item.lateDelta && (
                    <span className="ml-1 text-[11px] text-[#92400e]">
                      ({item.lateDelta})
                    </span>
                  )}
                </td>
                <td className="py-2.5 pl-3 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium tabular-nums ${
                      item.status === 'PRESENT'
                        ? 'bg-[#dcfae5] text-[#04250e]'
                        : item.status === 'LATE'
                        ? 'bg-[#fffbeb] text-[#92400e]'
                        : item.status === 'PENDING'
                        ? 'bg-[#ebedee] text-[#353736]'
                        : 'bg-[#f4f6f8] text-[#5d5f60]'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

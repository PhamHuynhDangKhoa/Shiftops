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
  station: string;
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
    station: 'Espresso Bar',
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
    station: 'Espresso Bar',
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
    station: 'Front POS',
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
    station: 'Front POS',
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
    station: 'Floor Service',
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
    station: 'Kitchen Prep',
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
    station: 'Front POS',
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
      return branchAttendance.map((a, idx) => {
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

        const stationFallback =
          idx % 4 === 0
            ? 'Espresso Bar'
            : idx % 4 === 1
            ? 'Front POS'
            : idx % 4 === 2
            ? 'Floor Service'
            : 'Kitchen Prep';

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
          station: stationFallback,
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
    <div className="bg-white rounded-2xl p-6 shadow-xs space-y-4">
      {/* Title & Link */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#131416]">
            Floor Attendance Roster
          </h2>
          <p className="text-xs text-[#5d5f60] mt-0.5">
            {items.length} assigned personnel across today&apos;s shift coverage
          </p>
        </div>
        <Link
          to="/attendance"
          className="text-xs text-[#131416] hover:underline font-semibold transition-colors"
        >
          Attendance log →
        </Link>
      </div>

      {/* Station Coverage Matrix (Answering: Are my store stations covered right now?) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 pb-1">
        <div className="bg-[#f8f9fa] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#64748b] block">
              Espresso Bar
            </span>
            <span className="text-xs font-bold text-[#131416]">2 / 2 Active</span>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#dcfce7] text-[#14532d]">
            Covered
          </span>
        </div>

        <div className="bg-[#f8f9fa] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#64748b] block">
              Front POS
            </span>
            <span className="text-xs font-bold text-[#131416]">2 / 2 Active</span>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#dcfce7] text-[#14532d]">
            Covered
          </span>
        </div>

        <div className="bg-[#f8f9fa] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#64748b] block">
              Floor Service
            </span>
            <span className="text-xs font-bold text-[#131416]">1 / 1 Active</span>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#dcfce7] text-[#14532d]">
            Covered
          </span>
        </div>

        <div className="bg-[#f8f9fa] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#64748b] block">
              Kitchen Prep
            </span>
            <span className="text-xs font-bold text-[#131416]">1 / 1 Active</span>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#dcfce7] text-[#14532d]">
            Covered
          </span>
        </div>
      </div>

      {/* Filter Tabs using Tone Buttons (No Card Borders) */}
      <div className="flex items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-[#131416] text-white'
              : 'text-[#5d5f60] hover:text-[#131416] hover:bg-[#f1f5f9]'
          }`}
        >
          All on shift ({items.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('PRESENT')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeFilter === 'PRESENT'
              ? 'bg-[#131416] text-white'
              : 'text-[#5d5f60] hover:text-[#131416] hover:bg-[#f1f5f9]'
          }`}
        >
          Present ({countPresent})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('LATE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeFilter === 'LATE'
              ? 'bg-[#131416] text-white'
              : 'text-[#5d5f60] hover:text-[#131416] hover:bg-[#f1f5f9]'
          }`}
        >
          Late ({countLate})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('PENDING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeFilter === 'PENDING'
              ? 'bg-[#131416] text-white'
              : 'text-[#5d5f60] hover:text-[#131416] hover:bg-[#f1f5f9]'
          }`}
        >
          Pending ({countPending})
        </button>
      </div>

      {/* Roster Table with Subtle Header Tone & Hover (Zero Card Borders) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] text-[#64748b] font-medium text-xs">
              <th className="py-2.5 px-3 rounded-l-xl font-medium">Staff member</th>
              <th className="py-2.5 px-3 font-medium">Station & Role</th>
              <th className="py-2.5 px-3 font-medium">Scheduled</th>
              <th className="py-2.5 px-3 font-medium">Clock-in</th>
              <th className="py-2.5 px-3 text-right rounded-r-xl font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr
                key={item.id}
                className="h-13 hover:bg-[#f8f9fa] transition-colors rounded-xl"
              >
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#f1f5f9] text-[#334155] font-bold text-xs flex items-center justify-center shrink-0">
                      {item.userName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </span>
                    <span className="font-semibold text-[#131416] text-sm">
                      {item.userName}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-[#5d5f60]">
                  <span className="font-medium text-[#131416] block">
                    {item.station}
                  </span>
                  <span className="text-[11px] text-[#64748b]">
                    {item.roleTitle}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-[#64748b] font-sans tabular-nums">
                  {item.shiftWindow}
                </td>
                <td className="py-2.5 px-3 font-sans tabular-nums text-[#131416]">
                  <span className="font-medium">{item.clockInTime}</span>
                  {item.lateDelta && (
                    <span className="ml-1.5 text-[11px] font-semibold text-[#b45309]">
                      ({item.lateDelta})
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold tabular-nums ${
                      item.status === 'PRESENT'
                        ? 'bg-[#dcfce7] text-[#14532d]'
                        : item.status === 'LATE'
                        ? 'bg-[#fef3c7] text-[#92400e]'
                        : item.status === 'PENDING'
                        ? 'bg-[#f1f5f9] text-[#475569]'
                        : 'bg-[#f1f5f9] text-[#475569]'
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

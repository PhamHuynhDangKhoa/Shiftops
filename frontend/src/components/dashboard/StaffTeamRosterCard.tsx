import React from 'react';

export interface TeammateItem {
  id: string;
  name: string;
  role: string;
  station: string;
  shiftWindow: string;
  isOnFloor: boolean;
}

const DEFAULT_TEAMMATES: TeammateItem[] = [
  {
    id: 'tm-1',
    name: 'Marcus Tanaka',
    role: 'Shift Supervisor',
    station: 'Espresso Bar 1',
    shiftWindow: '08:00 – 16:30',
    isOnFloor: true,
  },
  {
    id: 'tm-2',
    name: 'Aoi Mori',
    role: 'Barista Lead',
    station: 'Espresso Bar 2',
    shiftWindow: '08:00 – 16:30',
    isOnFloor: true,
  },
  {
    id: 'tm-3',
    name: 'Hana Endo',
    role: 'Cashier & Service',
    station: 'Front POS',
    shiftWindow: '08:30 – 16:30',
    isOnFloor: true,
  },
  {
    id: 'tm-4',
    name: 'Ren Ito',
    role: 'Floor Operations',
    station: 'Dining Floor',
    shiftWindow: '09:00 – 17:00',
    isOnFloor: true,
  },
];

export const StaffTeamRosterCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <h3 className="text-sm sm:text-base font-bold text-[#131416]">
            Floor Teammates
          </h3>
        </div>
        <span className="text-xs sm:text-sm text-[#475569] font-medium">
          4 active on shift
        </span>
      </div>

      <div className="space-y-2">
        {DEFAULT_TEAMMATES.map((tm) => (
          <div
            key={tm.id}
            className="p-2.5 rounded-lg bg-[#f8f9fa] flex items-center justify-between gap-3 hover:bg-[#f1f5f9] transition-colors text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-md bg-[#e2e8f0] text-[#131416] font-semibold text-xs flex items-center justify-center shrink-0">
                {tm.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
              <div className="min-w-0">
                <span className="font-semibold text-xs sm:text-sm text-[#131416] block truncate">
                  {tm.name}
                </span>
                <span className="text-xs text-[#475569] block truncate">
                  {tm.role}
                </span>
              </div>
            </div>

            <span className="text-xs font-medium text-[#131416] px-2 py-0.5 rounded bg-[#f1f5f9] shrink-0">
              {tm.station}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

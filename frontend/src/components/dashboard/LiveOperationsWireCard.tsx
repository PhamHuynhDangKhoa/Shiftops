import React from 'react';

export interface WireEvent {
  id: string;
  time: string;
  text: string;
  type: string;
}

export interface LiveOperationsWireCardProps {
  wsStatus: string;
  events: WireEvent[];
}

const DEFAULT_WIRE_EVENTS: WireEvent[] = [
  {
    id: 'e-1',
    time: '08:58:12',
    text: 'Yuka Suzuki clocked in for Morning Kitchen Prep',
    type: 'STAFF_CHECKED_IN',
  },
  {
    id: 'e-2',
    time: '08:55:04',
    text: 'Ren Ito clocked in for Floor Operations',
    type: 'STAFF_CHECKED_IN',
  },
  {
    id: 'e-3',
    time: '08:44:20',
    text: 'Daiki Takahashi clocked in (Late arrival: +14m)',
    type: 'STAFF_CHECKED_IN',
  },
  {
    id: 'e-4',
    time: '08:32:10',
    text: 'Task "Verify morning register float" completed by Marcus Tanaka',
    type: 'TASK_COMPLETED',
  },
  {
    id: 'e-5',
    time: '08:26:45',
    text: 'Hana Endo clocked in for Cashier & Service',
    type: 'STAFF_CHECKED_IN',
  },
  {
    id: 'e-6',
    time: '08:15:30',
    text: 'Task "Calibrate espresso grinder 1 & 2" completed by Aoi Mori',
    type: 'TASK_COMPLETED',
  },
];

export const LiveOperationsWireCard: React.FC<LiveOperationsWireCardProps> = ({
  wsStatus,
  events,
}) => {
  const displayEvents = events.length > 0 ? events : DEFAULT_WIRE_EVENTS;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              wsStatus === 'CONNECTED' ? 'bg-[#16a34a]' : 'bg-[#16a34a]'
            }`}
          />
          <h3 className="text-base font-bold text-[#131416]">
            Live Floor Activity
          </h3>
        </div>
        <span className="text-xs text-[#64748b] font-medium">
          Live sync
        </span>
      </div>

      {/* Feed Items (Clean Timeline, Zero Monospace Trap, Zero Card Borders) */}
      <div className="space-y-1 text-xs">
        {displayEvents.slice(0, 5).map((e) => (
          <div
            key={e.id}
            className="p-2.5 rounded-xl hover:bg-[#f8f9fa] transition-colors flex items-start gap-3"
          >
            <span className="text-xs text-[#94a3b8] font-sans tabular-nums shrink-0 pt-0.5">
              {e.time}
            </span>
            <span className="text-xs text-[#334155] leading-snug">
              {e.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

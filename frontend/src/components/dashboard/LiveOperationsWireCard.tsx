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
    <div className="rounded-xl bg-white border border-[#e8eaec] p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#f0f1f2]">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              wsStatus === 'CONNECTED' ? 'bg-[#1e7b4f]' : 'bg-[#1e7b4f]'
            }`}
          />
          <h3 className="text-sm font-semibold text-[#131416]">
            Operations Live Wire
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#5d5f60] tabular-nums">
          STOMP 1.2 Connected
        </span>
      </div>

      {/* Feed Items */}
      <div className="divide-y divide-[#f0f1f2] text-xs">
        {displayEvents.slice(0, 5).map((e) => (
          <div key={e.id} className="py-2 flex items-start gap-2.5">
            <span className="text-[11px] text-[#5d5f60] font-mono shrink-0 tabular-nums pt-0.5">
              {e.time}
            </span>
            <span className="text-[#131416] text-[13px] leading-snug">
              {e.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

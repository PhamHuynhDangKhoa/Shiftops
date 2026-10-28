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

export const LiveOperationsWireCard: React.FC<LiveOperationsWireCardProps> = ({
  wsStatus,
  events,
}) => {
  return (
    <div className="p-5 rounded-xl bg-[#131416] text-white border border-[#2a2f33] space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#2a2f33]">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              wsStatus === 'CONNECTED' ? 'bg-[#1e7b4f]' : 'bg-[#92400e]'
            }`}
          />
          <span className="text-xs font-bold tracking-tight uppercase">
            Live Operations Wire
          </span>
        </div>
        <span className="text-[10px] text-[#727477] font-mono tabular-nums">
          {wsStatus === 'CONNECTED' ? 'STOMP 1.2 Connected' : 'Syncing'}
        </span>
      </div>

      <div className="space-y-2 min-h-[140px] max-h-[180px] overflow-y-auto text-xs pr-1">
        {events.length === 0 ? (
          <div className="py-10 text-center text-[#727477] text-[11px]">
            Awaiting live telemetry (check-ins, task progress, incident updates)...
          </div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="p-2 rounded-md bg-[#1f2326] border border-[#2a2f33] flex items-start gap-2.5"
            >
              <span className="text-[10px] text-[#727477] font-mono shrink-0 tabular-nums">
                {e.time}
              </span>
              <span className="text-[#cdced1] text-xs leading-snug">
                {e.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

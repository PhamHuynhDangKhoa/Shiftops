import React from 'react';
import { Shift } from '../../lib/types';
import { Card, Badge, Button } from '../ui';
import { IconClock } from '../ui/Icons';

interface OutgoingDebriefCardProps {
  shifts?: Shift[];
  onOpenDebrief: (shiftId: string) => void;
}

export const OutgoingDebriefCard: React.FC<OutgoingDebriefCardProps> = ({
  shifts,
  onOpenDebrief,
}) => {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950 tracking-tight">
            Outgoing Shift Debrief
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Prepare, update, and finalize the operational debrief for incoming crew
          </p>
        </div>
      </div>

      {shifts && shifts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="p-3.5 bg-zinc-50 hover:bg-zinc-100/70 rounded-md border border-zinc-200 transition-colors flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-500">{shift.branchName}</span>
                  <Badge variant={shift.status === 'PUBLISHED' ? 'brand' : 'neutral'} size="sm">
                    {shift.status}
                  </Badge>
                </div>
                <h3 className="text-xs font-semibold text-zinc-950">{shift.name || 'Shift'}</h3>
                <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1 tabular-nums">
                  <IconClock size={11} className="text-zinc-400" />
                  <span>
                    {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                    {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  {shift.assignments.length} Staff: {shift.assignments.map((a) => a.userName).join(', ')}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-200/70 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenDebrief(shift.id)}
                  className="w-full justify-center"
                >
                  Manage Handover Debrief
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-zinc-400 font-mono">
          No shifts active in your current 24-hour turnover window.
        </div>
      )}
    </Card>
  );
};

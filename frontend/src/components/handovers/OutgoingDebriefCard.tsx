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
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div>
          <h2 className="text-base font-bold text-zinc-900">
            Outgoing Shift Debrief
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Prepare, update, and submit handover notes and checklist status for the next shift crew
          </p>
        </div>
      </div>

      {shifts && shifts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="p-4 bg-zinc-50/70 border border-zinc-200/80 rounded-xl flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500 font-medium">{shift.branchName}</span>
                  <Badge variant={shift.status === 'PUBLISHED' ? 'brand' : 'neutral'} size="sm">
                    {shift.status}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-zinc-900">{shift.name || 'Shift'}</h3>
                <div className="text-xs text-zinc-700 flex items-center gap-1.5 tabular-nums">
                  <IconClock size={13} className="text-zinc-400" />
                  <span>
                    {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                    {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 truncate">
                  Staff: {shift.assignments.map((a) => a.userName).join(', ') || 'Unassigned'}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-200/60 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onOpenDebrief(shift.id)}
                  className="w-full text-xs"
                >
                  Prepare Debrief
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-zinc-500">
          No shifts ready for handover debrief.
        </div>
      )}
    </Card>
  );
};

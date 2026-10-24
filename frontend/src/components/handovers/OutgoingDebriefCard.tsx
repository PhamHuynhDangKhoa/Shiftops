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
    <Card className="p-5 space-y-4 border border-[#262c38] bg-[#11141a]" chamfer>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262c38]">
        <div>
          <span className="text-[10px] font-mono font-bold text-[#00f0ff] uppercase tracking-wider block">
            // SHIFT TURNOVER PROTOCOL
          </span>
          <h2 className="text-sm font-mono font-bold text-white tracking-wider uppercase mt-0.5">
            OUTGOING SHIFT DEBRIEF GENERATION
          </h2>
          <p className="text-xs font-mono text-[#9da8b9] mt-0.5">
            Prepare, update, and finalize the operational debrief for incoming crew
          </p>
        </div>
      </div>

      {shifts && shifts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="p-4 bg-[#161922] border border-[#2a2f3d] border-l-2 border-l-[#00f0ff] flex flex-col justify-between gap-3 clip-chamfer-btn"
            >
              <div className="space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#606c80] uppercase">{shift.branchName}</span>
                  <Badge variant={shift.status === 'PUBLISHED' ? 'cyan' : 'neutral'} size="sm">
                    {shift.status}
                  </Badge>
                </div>
                <h3 className="text-xs font-bold text-white uppercase">{shift.name || 'Shift'}</h3>
                <div className="text-[11px] text-[#00f0ff] flex items-center gap-1.5 tabular-nums">
                  <IconClock size={12} className="text-[#00f0ff]" />
                  <span>
                    {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                    {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[10px] text-[#9da8b9] truncate">
                  OPERATORS: {shift.assignments.map((a) => a.userName).join(', ') || 'Unassigned'}
                </p>
              </div>

              <div className="pt-2 border-t border-[#262c38] flex justify-end">
                <Button
                  variant="cyan"
                  size="sm"
                  onClick={() => onOpenDebrief(shift.id)}
                  className="w-full justify-center shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                >
                  [ PREPARE DEBRIEF ]
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs font-mono text-[#606c80]">
          [ NO ACTIVE OPERATIONAL SHIFTS FOUND FOR DEBRIEF GENERATION ]
        </div>
      )}
    </Card>
  );
};

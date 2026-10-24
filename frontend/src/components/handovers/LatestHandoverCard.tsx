import React from 'react';
import { ShiftHandover } from '../../lib/types';
import { Card, Button } from '../ui';
import { HandoverStatusBadge } from './HandoverStatusBadge';
import { HandoverSummaryCounters } from './HandoverSummaryCounters';
import { HandoverItemList } from './HandoverItemList';
import { IconHandshake, IconCheck } from '../ui/Icons';

interface LatestHandoverCardProps {
  handover: ShiftHandover | null;
  isLoading: boolean;
  onAcknowledgeClick: (handover: ShiftHandover) => void;
}

export const LatestHandoverCard: React.FC<LatestHandoverCardProps> = ({
  handover,
  isLoading,
  onAcknowledgeClick,
}) => {
  return (
    <Card className="p-5 space-y-5 border border-[#262c38] bg-[#11141a]" chamfer>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262c38]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-[#00f0ff] uppercase tracking-wider">
              INCOMING SHIFT OPERATIONAL BRIEFING
            </span>
            {handover && <HandoverStatusBadge status={handover.status} />}
          </div>
          <h2 className="text-base font-mono font-bold text-white tracking-wider uppercase">
            {handover ? `HANDOVER: ${handover.shiftName || 'Operational Shift'}` : '[ NO ACTIVE HANDOVER FOR SECTOR ]'}
          </h2>
          {handover && (
            <p className="text-xs text-[#9da8b9] mt-0.5 font-mono tabular-nums">
              SHIFT: {new Date(handover.shiftStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
              {new Date(handover.shiftEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
              DISPATCHED BY <strong className="text-white">{handover.submittedByName || 'Staff'}</strong> AT{' '}
              {handover.submittedAt ? new Date(handover.submittedAt).toLocaleTimeString() : 'N/A'}
            </p>
          )}
        </div>

        {handover && handover.status === 'SUBMITTED' && (
          <Button
            variant="amber"
            size="md"
            onClick={() => onAcknowledgeClick(handover)}
            className="gap-2 shadow-[0_0_12px_rgba(255,107,0,0.25)]"
          >
            <IconCheck size={14} />
            <span>[ ACKNOWLEDGE HANDOVER ]</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs font-mono text-[#00f0ff]">
          [ SYNCING_INCOMING_HANDOVER... ]
        </div>
      ) : handover ? (
        <div className="space-y-4 font-mono">
          <HandoverSummaryCounters summary={handover.summary} />

          {handover.notes && (
            <div className="p-3 bg-[#161922] border border-[#262c38] text-xs">
              <span className="text-[10px] font-bold text-[#606c80] uppercase tracking-wider block mb-1">
                OPERATIONAL DEBRIEF NOTES:
              </span>
              <p className="text-[#f1f5f9] leading-relaxed whitespace-pre-line font-sans">
                {handover.notes}
              </p>
            </div>
          )}

          <HandoverItemList items={handover.items} />
        </div>
      ) : (
        <div className="py-8 text-center text-xs font-mono text-[#606c80]">
          <IconHandshake size={24} className="mx-auto mb-2 text-[#606c80]" />
          <p className="font-bold text-white uppercase">[ NO PREVIOUS SHIFT DEBRIEF REGISTERED ]</p>
          <p className="text-[11px] text-[#606c80] mt-0.5">
            Outgoing staff will generate debrief items at the conclusion of their schedule.
          </p>
        </div>
      )}
    </Card>
  );
};

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
    <Card className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Incoming Shift Briefing
            </span>
            {handover && <HandoverStatusBadge status={handover.status} />}
          </div>
          <h2 className="text-lg font-bold text-zinc-900">
            {handover ? `Handover: ${handover.shiftName || 'Operational Shift'}` : 'No Active Handover for Branch'}
          </h2>
          {handover && (
            <p className="text-xs text-zinc-500 mt-1 tabular-nums">
              Shift window: {new Date(handover.shiftStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
              {new Date(handover.shiftEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
              Submitted by <strong className="text-zinc-800 font-semibold">{handover.submittedByName || 'Staff'}</strong> at{' '}
              {handover.submittedAt ? new Date(handover.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </p>
          )}
        </div>

        {handover && handover.status === 'SUBMITTED' && (
          <Button
            variant="primary"
            size="md"
            onClick={() => onAcknowledgeClick(handover)}
            className="gap-2 shadow-xs"
          >
            <IconCheck size={16} />
            <span>Acknowledge Handover</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-zinc-500">
          Loading shift handover briefing...
        </div>
      ) : handover ? (
        <div className="space-y-4">
          <HandoverSummaryCounters summary={handover.summary} />

          {handover.notes && (
            <div className="p-4 bg-zinc-50/80 border border-zinc-200/80 rounded-xl text-xs space-y-1">
              <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider block">
                Shift Debrief Notes:
              </span>
              <p className="text-zinc-700 leading-relaxed whitespace-pre-line text-sm">
                {handover.notes}
              </p>
            </div>
          )}

          <HandoverItemList items={handover.items} />
        </div>
      ) : (
        <div className="py-8 text-center text-zinc-500">
          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-2">
            <IconHandshake size={20} />
          </div>
          <p className="font-semibold text-zinc-800 text-sm">No previous shift handover recorded</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Outgoing staff will generate handover debrief items at the end of their shift.
          </p>
        </div>
      )}
    </Card>
  );
};

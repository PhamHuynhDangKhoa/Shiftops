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
    <Card className="p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">
              Incoming Shift Briefing
            </span>
            {handover && <HandoverStatusBadge status={handover.status} />}
          </div>
          <h2 className="text-base font-semibold text-zinc-950 tracking-tight">
            {handover ? `Handover: ${handover.shiftName || 'Operational Shift'}` : 'No active handover for branch'}
          </h2>
          {handover && (
            <p className="text-xs text-zinc-500 mt-0.5 font-mono tabular-nums">
              Shift: {new Date(handover.shiftStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
              {new Date(handover.shiftEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
              Submitted by <strong className="text-zinc-800">{handover.submittedByName || 'Staff'}</strong> at{' '}
              {handover.submittedAt ? new Date(handover.submittedAt).toLocaleTimeString() : 'N/A'}
            </p>
          )}
        </div>

        {handover && handover.status === 'SUBMITTED' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAcknowledgeClick(handover)}
            className="gap-1.5"
          >
            <IconCheck size={14} />
            <span>Acknowledge Handover</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs font-mono text-zinc-400">
          Loading incoming shift handover...
        </div>
      ) : handover ? (
        <div className="space-y-4">
          <HandoverSummaryCounters summary={handover.summary} />

          {handover.notes && (
            <div>
              <span className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                Debrief Notes & Directives
              </span>
              <div className="p-3 rounded-md bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed">
                {handover.notes}
              </div>
            </div>
          )}

          <HandoverItemList items={handover.items} />

          {handover.acknowledgedByName && (
            <div className="pt-2 border-t border-zinc-100 text-xs font-mono text-zinc-500 flex items-center justify-between">
              <span>
                Acknowledged by <strong className="text-zinc-800">{handover.acknowledgedByName}</strong>
              </span>
              <span>{handover.acknowledgedAt ? new Date(handover.acknowledgedAt).toLocaleTimeString() : ''}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="py-8 text-center text-zinc-500 text-xs">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-2">
            <IconHandshake size={16} />
          </div>
          <p className="font-medium text-zinc-800">No pending handover</p>
          <p className="text-zinc-400 text-[11px] mt-0.5">
            Previous shift concluded without an outstanding debrief ledger.
          </p>
        </div>
      )}
    </Card>
  );
};

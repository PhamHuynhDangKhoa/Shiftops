import React from 'react';
import { ShiftHandover } from '../../lib/types';
import { HandoverStatusBadge } from './HandoverStatusBadge';
import { HandoverSummaryCounters } from './HandoverSummaryCounters';
import { HandoverItemList } from './HandoverItemList';
import { IconCheck, IconFileText } from '../ui/Icons';
import { formatHandoverTime, formatHandoverDateTime } from './handoverUtils';

interface LatestHandoverCardProps {
  handover: ShiftHandover | null;
  isLoading: boolean;
  onAcknowledgeClick: (handover: ShiftHandover) => void;
  onOpenDebriefModal?: (handover: ShiftHandover) => void;
}

export const LatestHandoverCard: React.FC<LatestHandoverCardProps> = ({
  handover,
  isLoading,
  onAcknowledgeClick,
  onOpenDebriefModal,
}) => {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-[13px] text-[#5d5f60] border border-[#e8eaec] bg-white rounded-md">
        Loading operational turnover briefing...
      </div>
    );
  }

  if (!handover) {
    return (
      <div className="p-8 text-center text-[#5d5f60] border border-[#e8eaec] bg-white rounded-md">
        <p className="font-semibold text-[#131416] text-[14px]">
          No active shift handover recorded
        </p>
        <p className="text-[13px] text-[#5d5f60] mt-1">
          Outgoing supervisor will log turnover notes at the close of their shift.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dossier Header: Pure title, transfer path, and action */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#e8eaec]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-[18px] font-bold text-[#131416]">
              {handover.shiftName || 'Operational Shift'}
            </h2>
            <HandoverStatusBadge status={handover.status} />
          </div>

          {/* Supervisor transfer path & hours */}
          <p className="text-[13px] text-[#5d5f60] mt-1 tabular-nums">
            <strong className="text-[#131416] font-medium">{handover.submittedByName || 'Outgoing Supervisor'}</strong>
            <span className="text-[#8c8f92] mx-1.5">→</span>
            <span className={handover.acknowledgedByName ? 'text-[#1e7b4f] font-medium' : 'text-[#5d5f60] italic'}>
              {handover.acknowledgedByName || 'Pending Acceptance'}
            </span>
            <span className="text-[#5d5f60] mx-2">·</span>
            <span className="font-mono text-[12px]">{formatHandoverTime(handover.shiftStartTime)} – {formatHandoverTime(handover.shiftEndTime)}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onOpenDebriefModal && (
            <button
              type="button"
              onClick={() => onOpenDebriefModal(handover)}
              className="h-8 px-3 text-[13px] font-medium rounded border border-[#e8eaec] bg-white text-[#131416] hover:bg-[#f0f1f2] transition-colors inline-flex items-center gap-1.5"
            >
              <IconFileText size={13} className="text-[#5d5f60]" />
              <span>Full Dossier</span>
            </button>
          )}

          {handover.status === 'SUBMITTED' && (
            <button
              type="button"
              onClick={() => onAcknowledgeClick(handover)}
              className="h-8 px-3.5 text-[13px] font-medium rounded bg-[#131416] text-white hover:bg-black transition-colors inline-flex items-center gap-1.5"
            >
              <IconCheck size={14} />
              <span>Sign Turnover</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Flat 4-Cell Telemetry Strip */}
      <HandoverSummaryCounters summary={handover.summary} />

      {/* 2. Supervisor Narrative */}
      {handover.notes && (
        <div className="p-3.5 rounded-md bg-[#f9fbfc] border border-[#e8eaec] text-[13px] text-[#131416] leading-relaxed">
          <span className="text-[12px] text-[#5d5f60] font-medium block mb-1">
            Supervisor debrief note:
          </span>
          <p className="whitespace-pre-line">{handover.notes}</p>
        </div>
      )}

      {/* 3. Items Ledger */}
      <HandoverItemList items={handover.items} />

      {/* 4. Verified Sign-Off Confirmation (If Acknowledged) */}
      {handover.status === 'ACKNOWLEDGED' && (
        <div className="p-3 rounded-md border border-[#c2e4d0] bg-[#eaf5ef] flex items-center justify-between gap-3 text-[13px]">
          <div className="flex items-center gap-2 text-[#1e7b4f]">
            <IconCheck size={15} className="flex-shrink-0" />
            <span>
              Store responsibility formally accepted by <strong>{handover.acknowledgedByName}</strong> at{' '}
              {formatHandoverDateTime(handover.acknowledgedAt)}.
            </span>
          </div>
          {handover.acknowledgementNotes && (
            <span className="text-[12px] text-[#5d5f60] italic truncate max-w-xs">
              &ldquo;{handover.acknowledgementNotes}&rdquo;
            </span>
          )}
        </div>
      )}
    </div>
  );
};

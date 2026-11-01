import React from 'react';
import { ShiftHandover, Shift, PagedResponse } from '../../lib/types';
import { IconCheck, IconClock, IconFileText, IconPlus } from '../ui/Icons';
import { formatHandoverDate, formatHandoverTime } from './handoverUtils';
import { HandoverStatusBadge } from './HandoverStatusBadge';

interface HandoverSupervisorAuditRailProps {
  currentHandover: ShiftHandover | null;
  outgoingShifts: Shift[];
  historyPage: PagedResponse<ShiftHandover>;
  onOpenDebrief: (shiftId: string) => void;
  onViewHistoryDossier: (handover: ShiftHandover) => void;
  onAcknowledgeClick: (handover: ShiftHandover) => void;
}

export const HandoverSupervisorAuditRail: React.FC<HandoverSupervisorAuditRailProps> = ({
  currentHandover,
  outgoingShifts,
  historyPage,
  onOpenDebrief,
  onViewHistoryDossier,
  onAcknowledgeClick,
}) => {
  const isPendingAck = currentHandover?.status === 'SUBMITTED';

  return (
    <div className="space-y-5">
      {/* 1. Digital Sign-Off Transfer Deck */}
      <div className="border border-[#e8eaec] bg-white rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#e8eaec]">
          <h3 className="text-[13px] font-semibold text-[#131416]">
            Dual sign-off accountability
          </h3>
          {currentHandover && <HandoverStatusBadge status={currentHandover.status} />}
        </div>

        <div className="space-y-3 text-[13px]">
          {/* Outgoing Supervisor */}
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#1e7b4f] text-white flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5">
              1
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-[#5d5f60] uppercase block">
                Outgoing Lead Submission
              </span>
              <span className="font-medium text-[#131416] block truncate">
                {currentHandover?.submittedByName || 'Kenji Sato'}
              </span>
              <span className="font-mono text-[11px] text-[#5d5f60] tabular-nums block">
                Signed {currentHandover?.submittedAt ? formatHandoverTime(currentHandover.submittedAt) : '14:02 JST'}
              </span>
            </div>
          </div>

          {/* Incoming Supervisor */}
          <div className="flex items-start gap-2.5">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5 ${
                currentHandover?.status === 'ACKNOWLEDGED'
                  ? 'bg-[#1e7b4f] text-white'
                  : 'bg-[#fef3c7] text-[#92400e]'
              }`}
            >
              2
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-[#5d5f60] uppercase block">
                Incoming Lead Acceptance
              </span>
              <span className="font-medium text-[#131416] block truncate">
                {currentHandover?.acknowledgedByName || 'Marcus Tanaka'}
              </span>
              <span className="font-mono text-[11px] tabular-nums block">
                {currentHandover?.status === 'ACKNOWLEDGED' ? (
                  <span className="text-[#1e7b4f]">
                    Accepted {formatHandoverTime(currentHandover.acknowledgedAt)}
                  </span>
                ) : (
                  <span className="text-[#92400e]">Pending incoming signature</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {isPendingAck && currentHandover && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onAcknowledgeClick(currentHandover)}
              className="w-full h-8 px-3 text-xs font-medium rounded bg-[#1e7b4f] text-white hover:bg-[#165c3b] border border-[#1e7b4f] transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <IconCheck size={14} />
              <span>Sign & Accept Store</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Outgoing Shift Debrief Station */}
      <div className="border border-[#e8eaec] bg-white rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#e8eaec]">
          <h3 className="text-[13px] font-semibold text-[#131416]">
            Outgoing shifts to debrief
          </h3>
          <span className="text-[12px] text-[#5d5f60] tabular-nums">
            {outgoingShifts.length} ready
          </span>
        </div>

        {outgoingShifts && outgoingShifts.length > 0 ? (
          <div className="space-y-2">
            {outgoingShifts.map((s) => (
              <div
                key={s.id}
                className="p-3 bg-[#f9fbfc] border border-[#e8eaec] rounded-md space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#131416] text-[13px] truncate">
                    {s.name}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#5d5f60] tabular-nums flex items-center gap-1.5">
                  <IconClock size={12} className="text-[#8c8f92]" />
                  <span>
                    {formatHandoverTime(s.startTime)} – {formatHandoverTime(s.endTime)}
                  </span>
                </div>
                <div className="pt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenDebrief(s.id)}
                    className="h-7 px-2.5 text-[12px] font-medium rounded border border-[#131416] bg-white text-[#131416] hover:bg-[#f0f1f2] transition-colors inline-flex items-center gap-1"
                  >
                    <IconPlus size={12} />
                    <span>Prepare Debrief</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-[#5d5f60] py-2">
            No active shifts awaiting turnover debrief.
          </p>
        )}
      </div>

      {/* 3. Recent Audit Archive (Quiet List) */}
      <div className="border border-[#e8eaec] bg-white rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#e8eaec]">
          <h3 className="text-[13px] font-semibold text-[#131416]">
            Recent turnover archive
          </h3>
        </div>

        <div className="divide-y divide-[#e8eaec]">
          {historyPage.content.slice(0, 3).map((ho) => {
            const total = ho.summary?.totalTasks ?? 0;
            const completed = ho.summary?.completedTasks ?? 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 100;

            return (
              <div key={ho.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-[#131416] truncate max-w-[170px]">
                    {ho.shiftName || 'Shift'}
                  </span>
                  <span className="font-mono text-[11px] text-[#1e7b4f] font-medium tabular-nums">
                    {pct}% done
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] text-[#5d5f60] tabular-nums">
                  <span>
                    {formatHandoverDate(ho.shiftStartTime)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onViewHistoryDossier(ho)}
                    className="text-[#131416] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <IconFileText size={11} />
                    <span>Dossier</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

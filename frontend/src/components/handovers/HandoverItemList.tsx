import React, { useState } from 'react';
import { HandoverItem, HandoverItemType } from '../../lib/types';
import { IconAlertTriangle, IconCheck, IconClock, IconFileText } from '../ui/Icons';

interface HandoverItemListProps {
  items: HandoverItem[];
}

export const HandoverItemList: React.FC<HandoverItemListProps> = ({ items }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!items || items.length === 0) {
    return (
      <div className="py-6 text-center text-[13px] text-[#5d5f60]">
        No turnover checklist items recorded for this shift.
      </div>
    );
  }

  const filteredItems = items.filter((it) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'ATTENTION') return it.type === 'ISSUE' || it.type === 'PENDING';
    return it.type === filterType;
  });

  const attentionCount = items.filter((it) => it.type === 'ISSUE' || it.type === 'PENDING').length;

  return (
    <div className="space-y-2">
      {/* List Header with Quiet Filter */}
      <div className="flex items-center justify-between pb-2 border-b border-[#e8eaec]">
        <h3 className="text-[14px] font-semibold text-[#131416]">
          Turnover items & store conditions
        </h3>

        {/* Quiet segment filter */}
        <div className="flex items-center gap-1 text-[12px]">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterType === 'ALL'
                ? 'bg-[#131416] text-white font-medium'
                : 'text-[#5d5f60] hover:text-[#131416]'
            }`}
          >
            All ({items.length})
          </button>
          {attentionCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterType('ATTENTION')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterType === 'ATTENTION'
                  ? 'bg-[#131416] text-white font-medium'
                  : 'text-[#5d5f60] hover:text-[#131416]'
              }`}
            >
              Needs Attention ({attentionCount})
            </button>
          )}
        </div>
      </div>

      {/* Quiet Linear-Style Ledger Rows */}
      <div className="divide-y divide-[#e8eaec] border border-[#e8eaec] rounded-md bg-white">
        {filteredItems.map((it, idx) => {
          const isIssue = it.type === 'ISSUE';
          const isPending = it.type === 'PENDING';

          return (
            <div
              key={it.id || idx}
              className={`p-3.5 flex items-start gap-3 transition-colors ${
                isIssue ? 'bg-[#fffdfa]' : 'hover:bg-[#f9fbfc]'
              }`}
            >
              {/* Status Mark: Grey for normal, Amber ONLY for issues */}
              <div className="pt-0.5 flex-shrink-0">
                {isIssue ? (
                  <span className="w-5 h-5 rounded flex items-center justify-center bg-[#fef3c7] text-[#92400e]">
                    <IconAlertTriangle size={13} />
                  </span>
                ) : isPending ? (
                  <span className="w-5 h-5 rounded flex items-center justify-center bg-[#f0f1f2] text-[#5d5f60]">
                    <IconClock size={13} />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded flex items-center justify-center bg-[#f0f1f2] text-[#5d5f60]">
                    <IconCheck size={13} />
                  </span>
                )}
              </div>

              {/* Item Narrative */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#131416] leading-relaxed">
                  {it.content}
                </p>

                {/* Linked Ticket Callout (Only when an active ticket is tied to this item) */}
                {it.issueTitle && (
                  <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[#fde68a] bg-[#fef3c7] text-[12px] text-[#92400e]">
                    <IconAlertTriangle size={12} className="flex-shrink-0" />
                    <span className="font-medium">
                      Incident Ticket: {it.issueTitle}
                    </span>
                    {it.issueStatus && (
                      <span className="text-[11px] px-1 py-0.2 bg-white/80 rounded border border-[#fde68a] font-medium">
                        {it.issueStatus}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ShiftHandover, PagedResponse } from '../../lib/types';
import { HandoverStatusBadge } from './HandoverStatusBadge';
import { IconFileText, IconSearch } from '../ui/Icons';
import { formatHandoverDate, formatHandoverTime } from './handoverUtils';

interface HandoverHistoryTableProps {
  historyPage?: PagedResponse<ShiftHandover>;
  isLoading: boolean;
  onViewDetails: (handover: ShiftHandover) => void;
}

export const HandoverHistoryTable: React.FC<HandoverHistoryTableProps> = ({
  historyPage,
  isLoading,
  onViewDetails,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACKNOWLEDGED' | 'SUBMITTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const rawList = historyPage?.content || [];

  const filteredList = rawList.filter((ho) => {
    if (statusFilter !== 'ALL' && ho.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchShift = ho.shiftName?.toLowerCase().includes(q);
      const matchOut = ho.submittedByName?.toLowerCase().includes(q);
      const matchIn = ho.acknowledgedByName?.toLowerCase().includes(q);
      const matchNotes = ho.notes?.toLowerCase().includes(q);
      if (!matchShift && !matchOut && !matchIn && !matchNotes) return false;
    }
    return true;
  });

  return (
    <div className="border border-[#e8eaec] bg-white rounded-lg p-5 sm:p-6 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e8eaec]">
        <div>
          <h2 className="text-[16px] font-semibold text-[#131416]">
            Handover History & Audit Archive
          </h2>
          <p className="text-[13px] text-[#5d5f60] mt-0.5">
            Audit trail of finalized and acknowledged shift debriefs across store branches
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 border border-[#e8eaec] rounded-md p-0.5 bg-[#f9fbfc]">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-[#131416] border border-[#e8eaec]'
                  : 'text-[#5d5f60] hover:text-[#131416]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACKNOWLEDGED')}
              className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
                statusFilter === 'ACKNOWLEDGED'
                  ? 'bg-white text-[#131416] border border-[#e8eaec]'
                  : 'text-[#5d5f60] hover:text-[#131416]'
              }`}
            >
              Acknowledged
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('SUBMITTED')}
              className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
                statusFilter === 'SUBMITTED'
                  ? 'bg-white text-[#131416] border border-[#e8eaec]'
                  : 'text-[#5d5f60] hover:text-[#131416]'
              }`}
            >
              Pending Ack
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <IconSearch
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8c8f92] pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dossiers..."
              className="h-8 pl-8 pr-3 text-[13px] rounded-md border border-[#e8eaec] bg-white text-[#131416] placeholder:text-[#8c8f92] focus:outline-none focus:border-[#131416] w-36 sm:w-48"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-[13px] text-[#5d5f60]">
          Loading handover history...
        </div>
      ) : filteredList.length > 0 ? (
        <div className="overflow-x-auto border border-[#e8eaec] rounded-lg">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-[#e8eaec] bg-[#f9fbfc] text-[#5d5f60] text-[12px] font-medium">
                <th className="py-2.5 px-4 font-medium">Shift & Date</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium">Task Resolution</th>
                <th className="py-2.5 px-4 font-medium">Turnover Transfer</th>
                <th className="py-2.5 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eaec] text-[#131416]">
              {filteredList.map((ho) => {
                const total = ho.summary?.totalTasks ?? 0;
                const completed = ho.summary?.completedTasks ?? 0;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 100;

                return (
                  <tr key={ho.id} className="hover:bg-[#f9fbfc] transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-[#131416] block text-[14px]">
                        {ho.shiftName || 'Operational Shift'}
                      </span>
                      <span className="text-[12px] text-[#5d5f60] tabular-nums">
                        {formatHandoverDate(ho.shiftStartTime)} · {formatHandoverTime(ho.shiftStartTime)}–{formatHandoverTime(ho.shiftEndTime)}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <HandoverStatusBadge status={ho.status} />
                    </td>

                    <td className="py-3 px-4 tabular-nums text-[#131416] whitespace-nowrap text-[13px]">
                      {ho.summary ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-medium">{completed}/{total}</span>
                          <span className="text-[12px] text-[#5d5f60]">({pct}%)</span>
                        </div>
                      ) : (
                        <span className="text-[#8c8f92]">N/A</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[#131416] text-[13px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">{ho.submittedByName || 'Outgoing'}</span>
                        <span className="text-[#8c8f92]">→</span>
                        <span className={ho.acknowledgedByName ? 'text-[#1e7b4f] font-medium' : 'text-[#8c8f92] italic'}>
                          {ho.acknowledgedByName || 'Pending Sign'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewDetails(ho)}
                        className="h-8 px-3 text-[13px] font-medium rounded-md border border-[#e8eaec] bg-white text-[#131416] hover:bg-[#f0f1f2] transition-colors inline-flex items-center gap-1.5"
                      >
                        <IconFileText size={13} className="text-[#5d5f60]" />
                        <span>Inspect Dossier</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-[13px] text-[#5d5f60]">
          No historical handover records match the current filter.
        </div>
      )}
    </div>
  );
};

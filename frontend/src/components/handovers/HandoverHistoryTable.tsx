import React from 'react';
import { ShiftHandover, PagedResponse } from '../../lib/types';
import { Card, Button } from '../ui';
import { HandoverStatusBadge } from './HandoverStatusBadge';

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
  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="pb-3 border-b border-zinc-100">
        <h2 className="text-base font-bold text-zinc-900">
          Handover History
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Audit trail of finalized and acknowledged shift debriefs across branches
        </p>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-zinc-500">
          Loading handover history...
        </div>
      ) : historyPage && historyPage.content.length > 0 ? (
        <div className="overflow-x-auto border border-[#e8eaec] bg-white rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e8eaec] text-[#5d5f60] text-xs font-normal">
                <th className="py-2.5 px-3.5 font-normal">Shift & date</th>
                <th className="py-2.5 px-3.5 font-normal">Status</th>
                <th className="py-2.5 px-3.5 font-normal">Task resolution</th>
                <th className="py-2.5 px-3.5 font-normal">Submitted by</th>
                <th className="py-2.5 px-3.5 font-normal">Acknowledged by</th>
                <th className="py-2.5 px-3.5 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f1f2] text-[#131416]">
              {historyPage.content.map((ho) => (
                <tr key={ho.id} className="hover:bg-[#f4f6f8] transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-zinc-900 block">{ho.shiftName || 'Shift'}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(ho.shiftStartTime).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <HandoverStatusBadge status={ho.status} />
                  </td>
                  <td className="py-3.5 px-4 tabular-nums text-zinc-700 whitespace-nowrap text-xs font-medium">
                    {ho.summary ? `${ho.summary.completedTasks} / ${ho.summary.totalTasks} completed` : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 text-xs">
                    {ho.submittedByName || 'Staff Member'}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 text-xs">
                    {ho.acknowledgedByName || <span className="text-zinc-400 italic">Pending Signature</span>}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewDetails(ho)}
                    >
                      View Dossier
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-zinc-500">
          No historical handovers found.
        </div>
      )}
    </Card>
  );
};

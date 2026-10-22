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
    <Card className="p-5 space-y-4">
      <div className="pb-2 border-b border-zinc-100">
        <h2 className="text-sm font-semibold text-zinc-950 tracking-tight">
          Shift Handover History
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Audit trail of finalized and acknowledged shift handovers
        </p>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs font-mono text-zinc-400">
          Loading branch handover history...
        </div>
      ) : historyPage && historyPage.content.length > 0 ? (
        <div className="overflow-x-auto border border-zinc-200 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 font-medium">Shift & Date</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Task Progress</th>
                <th className="py-2.5 px-3 font-medium">Submitted By</th>
                <th className="py-2.5 px-3 font-medium">Acknowledged By</th>
                <th className="py-2.5 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {historyPage.content.map((ho) => (
                <tr key={ho.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-zinc-950 block">{ho.shiftName || 'Shift'}</span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {new Date(ho.shiftStartTime).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <HandoverStatusBadge status={ho.status} />
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-700 whitespace-nowrap">
                    {ho.summary ? `${ho.summary.completedTasks}/${ho.summary.totalTasks} done` : 'N/A'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-zinc-800">{ho.submittedByName || '—'}</span>
                    {ho.submittedAt && (
                      <span className="block text-[10px] font-mono text-zinc-400">
                        {new Date(ho.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-zinc-800">{ho.acknowledgedByName || '—'}</span>
                    {ho.acknowledgedAt && (
                      <span className="block text-[10px] font-mono text-zinc-400">
                        {new Date(ho.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewDetails(ho)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-zinc-400 font-mono">
          No previous shift handovers recorded for this branch.
        </div>
      )}
    </Card>
  );
};

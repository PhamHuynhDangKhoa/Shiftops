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
    <Card className="p-6 md:p-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>📜</span> Shift Handover History
        </h2>
        <p className="text-sm text-gray-500">Audit trail of submitted and acknowledged shift handovers.</p>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-400">Loading branch handover history...</div>
      ) : historyPage && historyPage.content.length > 0 ? (
        <div className="divide-y divide-gray-100 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-700">
            <thead className="text-xs font-bold text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="py-3 px-4">Shift & Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tasks</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Acknowledged By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historyPage.content.map((ho) => (
                <tr key={ho.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {ho.shiftName || 'Shift'}
                    <span className="block text-xs font-normal text-gray-500">
                      {new Date(ho.shiftStartTime).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <HandoverStatusBadge status={ho.status} />
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {ho.summary ? `${ho.summary.completedTasks}/${ho.summary.totalTasks} done` : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {ho.submittedByName || '—'}
                    {ho.submittedAt && (
                      <span className="block text-gray-400">
                        {new Date(ho.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    {ho.acknowledgedByName || '—'}
                    {ho.acknowledgedAt && (
                      <span className="block text-gray-400">
                        {new Date(ho.acknowledgedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      onClick={() => onViewDetails(ho)}
                      className="text-xs"
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">No historical handovers found for this branch.</p>
      )}
    </Card>
  );
};

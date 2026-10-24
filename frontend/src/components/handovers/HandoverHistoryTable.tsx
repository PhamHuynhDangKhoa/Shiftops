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
    <Card className="p-5 space-y-4 border border-[#262c38] bg-[#11141a]" chamfer>
      <div className="pb-3 border-b border-[#262c38]">
        <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
          HISTORICAL SHIFT HANDOVER DOSSIER
        </h2>
        <p className="text-xs font-mono text-[#9da8b9] mt-0.5">
          Audit trail of finalized and acknowledged shift handovers across sectors
        </p>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs font-mono text-[#00f0ff]">
          [ SYNCING_HANDOVER_ARCHIVE... ]
        </div>
      ) : historyPage && historyPage.content.length > 0 ? (
        <div className="overflow-x-auto border border-[#262c38] bg-[#11141a] clip-chamfer-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#161922] border-b border-[#262c38] text-[#9da8b9] font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3.5 font-bold">ROSTER & TIMESTAMPS</th>
                <th className="py-3 px-3.5 font-bold">TURNOVER STATUS</th>
                <th className="py-3 px-3.5 font-bold">TASK RESOLUTION</th>
                <th className="py-3 px-3.5 font-bold">DISPATCHED BY</th>
                <th className="py-3 px-3.5 font-bold">ACKNOWLEDGED BY</th>
                <th className="py-3 px-3.5 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e222b]">
              {historyPage.content.map((ho) => (
                <tr key={ho.id} className="hover:bg-[#181c24] transition-colors font-mono">
                  <td className="py-3 px-3.5">
                    <span className="font-bold text-white block uppercase">{ho.shiftName || 'Shift'}</span>
                    <span className="text-[10px] text-[#606c80]">
                      {new Date(ho.shiftStartTime).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <HandoverStatusBadge status={ho.status} />
                  </td>
                  <td className="py-3 px-3.5 font-mono text-[#00f0ff] whitespace-nowrap">
                    {ho.summary ? `${ho.summary.completedTasks}/${ho.summary.totalTasks} RESOLVED` : 'N/A'}
                  </td>
                  <td className="py-3 px-3.5 text-[#9da8b9]">
                    {ho.submittedByName || 'Operator'}
                  </td>
                  <td className="py-3 px-3.5 text-[#9da8b9]">
                    {ho.acknowledgedByName || <span className="text-[#606c80] italic">[ PENDING_SIGN ]</span>}
                  </td>
                  <td className="py-3 px-3.5 text-right whitespace-nowrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onViewDetails(ho)}
                      className="text-[11px]"
                    >
                      [ INSPECT ]
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-xs font-mono text-[#606c80]">
          [ NO HISTORICAL HANDOVERS RECORDED ]
        </div>
      )}
    </Card>
  );
};

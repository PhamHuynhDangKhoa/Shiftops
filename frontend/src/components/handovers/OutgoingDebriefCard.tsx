import React from 'react';
import { Shift } from '../../lib/types';
import { Card, Badge, Button } from '../ui';

interface OutgoingDebriefCardProps {
  shifts?: Shift[];
  onOpenDebrief: (shiftId: string) => void;
}

export const OutgoingDebriefCard: React.FC<OutgoingDebriefCardProps> = ({
  shifts,
  onOpenDebrief,
}) => {
  return (
    <Card className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>📝</span> Outgoing Shift Debrief
          </h2>
          <p className="text-sm text-gray-500">
            Prepare, update, and finalize the operational debrief for your current or completed shift.
          </p>
        </div>
      </div>

      {shifts && shifts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="p-4 bg-gray-50 hover:bg-blue-50/40 rounded-xl border border-gray-200 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-600">{shift.branchName}</span>
                  <Badge variant={shift.status === 'PUBLISHED' ? 'brand' : 'neutral'}>{shift.status}</Badge>
                </div>
                <h3 className="text-base font-bold text-gray-900">{shift.name || 'Shift'}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(shift.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} -{' '}
                  {new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {shift.assignments.length} Staff Assigned: {shift.assignments.map((a) => a.userName).join(', ')}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => onOpenDebrief(shift.id)}
                  className="text-xs font-bold"
                >
                  Manage Handover Debrief
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">No recent or active shifts available to debrief.</p>
      )}
    </Card>
  );
};

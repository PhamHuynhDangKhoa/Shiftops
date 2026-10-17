import React from 'react';
import { ShiftHandover } from '../../lib/types';
import { Card, Button } from '../ui';
import { HandoverStatusBadge } from './HandoverStatusBadge';
import { HandoverSummaryCounters } from './HandoverSummaryCounters';
import { HandoverItemList } from './HandoverItemList';

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
    <Card className="p-6 md:p-8 border-l-4 border-l-blue-600 shadow-sm bg-gradient-to-r from-white via-white to-blue-50/20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider uppercase text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
              Incoming Shift Debrief
            </span>
            {handover && <HandoverStatusBadge status={handover.status} />}
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {handover ? `Handover: ${handover.shiftName || 'Shift'}` : 'No active handover for branch'}
          </h2>
          {handover && (
            <p className="text-xs text-gray-500 mt-0.5">
              Shift: {new Date(handover.shiftStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
              {new Date(handover.shiftEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
              Submitted by <strong>{handover.submittedByName || 'Staff'}</strong> at{' '}
              {handover.submittedAt ? new Date(handover.submittedAt).toLocaleTimeString() : 'N/A'}
            </p>
          )}
        </div>

        {handover && handover.status === 'SUBMITTED' && (
          <Button
            variant="primary"
            onClick={() => onAcknowledgeClick(handover)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            ✓ Acknowledge Handover
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-400">Loading incoming shift handover...</div>
      ) : handover ? (
        <div className="space-y-6">
          {/* Live Derived Operational Counters */}
          <HandoverSummaryCounters summary={handover.summary} />

          {/* Outgoing Notes */}
          {handover.notes && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Operational Notes</h4>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{handover.notes}</p>
            </div>
          )}

          {/* Structured Handover Items */}
          <HandoverItemList items={handover.items} />

          {/* Acknowledgement Status Info */}
          {handover.status === 'ACKNOWLEDGED' && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              <strong>Acknowledged by:</strong> {handover.acknowledgedByName || 'Manager'} at{' '}
              {handover.acknowledgedAt ? new Date(handover.acknowledgedAt).toLocaleString() : 'N/A'}
              {handover.acknowledgementNotes && (
                <p className="mt-1 text-emerald-800 italic">"{handover.acknowledgementNotes}"</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-gray-500">
          No outgoing handover debriefs have been submitted for this branch yet.
        </div>
      )}
    </Card>
  );
};

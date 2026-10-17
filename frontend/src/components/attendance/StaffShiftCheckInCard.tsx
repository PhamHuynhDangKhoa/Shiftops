import React from 'react';
import { Shift, Attendance } from '../../lib/types';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

interface StaffShiftCheckInCardProps {
  shifts?: Shift[];
  attendanceList?: Attendance[];
  currentUserId?: string;
  isLoading: boolean;
  onCheckIn: (assignmentId: string) => void;
  onCheckOut: (assignmentId: string) => void;
  isCheckingIn: boolean;
  isCheckingOut: boolean;
}

const formatDateTime = (isoString?: string) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatTimeOnly = (isoString?: string) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const StaffShiftCheckInCard: React.FC<StaffShiftCheckInCardProps> = ({
  shifts,
  attendanceList,
  currentUserId,
  isLoading,
  onCheckIn,
  onCheckOut,
  isCheckingIn,
  isCheckingOut,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: '0 0 1rem 0' }}>
        📍 Current / Upcoming Shifts
      </h2>

      {isLoading ? (
        <p style={{ color: '#6b7280' }}>Loading your assigned shifts...</p>
      ) : !shifts || shifts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
          <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>No shifts assigned within the current window.</p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>Check the Shifts tab to view your complete schedule.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {shifts.map((shift) => {
            const assignment = shift.assignments?.find((a) => a.userId === currentUserId);
            if (!assignment) return null;

            const attendanceRecord = attendanceList?.find((att) => att.shiftAssignmentId === assignment.id);

            const now = new Date();
            const startTime = new Date(shift.startTime);
            const endTime = new Date(shift.endTime);
            const checkInOpenTime = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 mins early

            const isTooEarly = now < checkInOpenTime;
            const isPastEnd = now > endTime;
            const canCheckIn = !attendanceRecord && !isTooEarly && !isPastEnd;
            const canCheckOut =
              attendanceRecord &&
              (attendanceRecord.status === 'PRESENT' || attendanceRecord.status === 'LATE') &&
              !attendanceRecord.checkOutAt;

            return (
              <div
                key={shift.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  backgroundColor: '#f9fafb',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>
                      {shift.name || 'Scheduled Shift'}
                    </span>
                    {shift.overnight && (
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: '#ede9fe',
                          color: '#6d28d9',
                        }}
                      >
                        🌙 Overnight
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                    <div>🏢 <strong>{shift.branchName}</strong></div>
                    <div>📅 {formatDateTime(shift.startTime)} → {formatDateTime(shift.endTime)}</div>
                    {shift.notes && <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>"{shift.notes}"</div>}
                  </div>

                  {/* Attendance State Badge */}
                  <div style={{ margin: '0.75rem 0' }}>
                    {attendanceRecord ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>Status:</span>
                          <AttendanceStatusBadge status={attendanceRecord.status} late={attendanceRecord.late} />
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          In: {formatTimeOnly(attendanceRecord.checkInAt)}
                          {attendanceRecord.checkOutAt && ` | Out: ${formatTimeOnly(attendanceRecord.checkOutAt)}`}
                        </div>
                      </div>
                    ) : isTooEarly ? (
                      <div style={{ fontSize: '0.85rem', color: '#d97706', backgroundColor: '#fffbeb', padding: '0.5rem', borderRadius: '6px' }}>
                        ⏳ Check-in opens 15 mins before shift ({formatTimeOnly(checkInOpenTime.toISOString())})
                      </div>
                    ) : isPastEnd ? (
                      <div style={{ fontSize: '0.85rem', color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.5rem', borderRadius: '6px' }}>
                        ⚠️ Shift time has ended.
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '0.5rem', borderRadius: '6px' }}>
                        ✅ Check-in window is open!
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  {!attendanceRecord && (
                    <button
                      onClick={() => onCheckIn(assignment.id)}
                      disabled={!canCheckIn || isCheckingIn}
                      style={{
                        flex: 1,
                        padding: '0.65rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: canCheckIn ? '#059669' : '#9ca3af',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 600,
                        cursor: canCheckIn ? 'pointer' : 'not-allowed',
                        fontSize: '0.9rem',
                      }}
                    >
                      {isCheckingIn ? 'Checking In...' : '🟢 Clock In Now'}
                    </button>
                  )}

                  {canCheckOut && (
                    <button
                      onClick={() => onCheckOut(assignment.id)}
                      disabled={isCheckingOut}
                      style={{
                        flex: 1,
                        padding: '0.65rem 1rem',
                        borderRadius: '8px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      {isCheckingOut ? 'Checking Out...' : '🏁 Clock Out'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

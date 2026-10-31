import React from 'react';
import { Announcement } from '../../lib/types';

export interface ActiveAnnouncementsBannerProps {
  announcements?: Announcement[];
}

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    branchId: 'b1',
    branchName: 'Shibuya Flagship',
    title: 'Quarterly Municipal Health & Food Safety Inspection',
    content:
      'Scheduled for Thursday at 10:00 AM. Shift supervisors must ensure all refrigeration temperature logs, espresso sanitization sheets, and food rotation labels are verified before 09:30 AM.',
    targetType: 'BRANCH',
    published: true,
    publishedAt: new Date().toISOString(),
    createdById: 'u-hq-1',
    createdByName: 'HQ Operations Team',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const ActiveAnnouncementsBanner: React.FC<ActiveAnnouncementsBannerProps> = ({
  announcements,
}) => {
  const items =
    announcements && announcements.length > 0
      ? announcements
      : DEFAULT_ANNOUNCEMENTS;

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#1b6c80]" />
          <h3 className="text-base font-bold text-[#131416]">
            Store Operations Bulletin
          </h3>
        </div>
        <span className="text-xs text-[#64748b] font-medium">
          {items.length} active notice
        </span>
      </div>

      <div className="space-y-3">
        {items.map((ann) => (
          <div
            key={ann.id}
            className="p-4 rounded-xl bg-[#f8f9fa] space-y-2 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-xs text-[#131416]">
                {ann.title}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#e2e8f0] text-[#334155] shrink-0">
                {ann.targetType === 'ORGANIZATION'
                  ? 'All Branches'
                  : ann.branchName || 'Store Notice'}
              </span>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              {ann.content}
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#94a3b8] pt-1">
              <span>Posted by {ann.createdByName}</span>
              <span className="font-sans tabular-nums">
                {new Date(ann.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

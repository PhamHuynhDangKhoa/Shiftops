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
    <div className="rounded-xl bg-white border border-[#e8eaec] p-5">
      <div className="flex items-center justify-between pb-2 border-b border-[#f0f1f2]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1b6c80]" />
          <h3 className="text-sm font-semibold text-[#131416]">
            Active Operations Bulletins
          </h3>
        </div>
        <span className="text-xs text-[#5d5f60] font-mono tabular-nums">
          {items.length} active notice
        </span>
      </div>

      <div className="space-y-3 pt-3">
        {items.map((ann) => (
          <div
            key={ann.id}
            className="p-3.5 rounded-lg bg-[#f9fbfc] border border-[#e8eaec] space-y-2 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-[#131416] text-xs">
                {ann.title}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-white border border-[#cdced1] text-[#5d5f60] shrink-0">
                {ann.targetType === 'ORGANIZATION'
                  ? 'Organization'
                  : ann.branchName || 'Store Notice'}
              </span>
            </div>
            <p className="text-[13px] text-[#5d5f60] leading-relaxed">
              {ann.content}
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#5d5f60] pt-1 border-t border-[#f0f1f2]">
              <span>Posted by {ann.createdByName}</span>
              <span className="font-mono tabular-nums">
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

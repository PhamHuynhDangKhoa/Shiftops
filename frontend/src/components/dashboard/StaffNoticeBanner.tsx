import React, { useState } from 'react';
import { Announcement } from '../../lib/types';

export interface StaffNoticeBannerProps {
  announcements?: Announcement[];
}

export const StaffNoticeBanner: React.FC<StaffNoticeBannerProps> = ({
  announcements,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || !announcements || announcements.length === 0) return null;

  const topNotice = announcements[0];
  if (!topNotice) return null;

  return (
    <div className="bg-[#f8f9fa] rounded-xl p-4 transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#131416] shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-semibold text-[#475569] block">
              Store Notice
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#131416] truncate block">
              {topNotice.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs sm:text-sm font-semibold text-[#131416] hover:bg-[#e2e8f0] px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          >
            {isExpanded ? 'Hide' : 'Details'}
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss notice"
            className="text-[#475569] hover:text-[#131416] p-1 rounded-md transition-colors cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#e2e8f0] space-y-2 text-xs sm:text-sm">
          <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
            {topNotice.content}
          </p>
          <div className="flex items-center justify-between text-xs text-[#475569]">
            <span>Posted by {topNotice.createdByName}</span>
            <span className="font-sans tabular-nums">
              {new Date(topNotice.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

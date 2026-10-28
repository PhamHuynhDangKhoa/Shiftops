import React from 'react';
import { Announcement } from '../../lib/types';
import { IconMegaphone } from '../ui/Icons';

export interface ActiveAnnouncementsBannerProps {
  announcements?: Announcement[];
}

export const ActiveAnnouncementsBanner: React.FC<ActiveAnnouncementsBannerProps> = ({
  announcements,
}) => {
  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs px-1 text-[#5d5f60] font-medium">
        <span className="flex items-center gap-1.5">
          <IconMegaphone size={14} className="text-[#131416]" />
          <span>Active Operations Bulletins</span>
        </span>
        <span className="text-[11px] tabular-nums font-semibold">
          {announcements.length} posted
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className="p-4 rounded-xl bg-[#fffbeb] border border-[#92400e]/20 flex flex-col justify-between gap-2.5"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="font-bold text-sm text-[#92400e] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#92400e]" />
                  {ann.title}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#ffffff] text-[#92400e] border border-[#92400e]/30">
                  {ann.targetType === 'ORGANIZATION'
                    ? 'All Branches'
                    : ann.branchName || 'Store Notice'}
                </span>
              </div>
              <p className="text-xs text-[#92400e]/90 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#92400e]/80 pt-2 border-t border-[#92400e]/15">
              <span>Posted by {ann.createdByName}</span>
              <span className="tabular-nums">
                {new Date(ann.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

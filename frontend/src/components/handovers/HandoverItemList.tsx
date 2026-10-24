import React from 'react';
import { HandoverItem, HandoverItemType } from '../../lib/types';
import { Badge } from '../ui';

interface HandoverItemListProps {
  items: HandoverItem[];
}

const getItemBadgeVariant = (type: HandoverItemType): 'success' | 'warning' | 'urgent' | 'brand' | 'neutral' => {
  switch (type) {
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'ISSUE':
      return 'urgent';
    case 'NOTE':
      return 'brand';
    default:
      return 'neutral';
  }
};

export const HandoverItemList: React.FC<HandoverItemListProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <h4 className="text-[10px] font-mono font-bold text-[#8a94a6] uppercase tracking-wider mb-2">
        Operational Handover Items
      </h4>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div
            key={it.id}
            className="p-2.5 bg-[#161922] border border-[#262c38] flex items-start gap-2.5 text-xs font-mono"
          >
            <Badge variant={getItemBadgeVariant(it.type)} size="sm">{it.type}</Badge>
            <div className="flex-1 text-[#f1f5f9] min-w-0">
              <span className="leading-snug">{it.content}</span>
              {it.issueTitle && (
                <span className="block text-[11px] font-mono text-[#ff335c] mt-1">
                  Linked Issue: {it.issueTitle} ({it.issueStatus})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

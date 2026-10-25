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
      <h4 className="text-xs font-medium text-[#131416] mb-2">
        Handover items ({items.length})
      </h4>
      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="p-3 bg-zinc-50/80 border border-zinc-200/80 rounded-xl flex items-start gap-3 text-xs"
          >
            <Badge variant={getItemBadgeVariant(it.type)} size="sm">{it.type}</Badge>
            <div className="flex-1 text-zinc-800 min-w-0">
              <span className="leading-relaxed text-sm block">{it.content}</span>
              {it.issueTitle && (
                <span className="block text-xs text-rose-700 font-medium mt-1">
                  Linked Incident: {it.issueTitle} ({it.issueStatus})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

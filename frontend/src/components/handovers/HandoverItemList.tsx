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
      <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Structured Items</h4>
      <div className="space-y-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="p-3 bg-white rounded-lg border border-gray-200 shadow-2xs flex items-start gap-3"
          >
            <Badge variant={getItemBadgeVariant(it.type)}>{it.type}</Badge>
            <div className="flex-1 text-sm text-gray-900">
              {it.content}
              {it.issueTitle && (
                <span className="block text-xs text-red-600 mt-0.5 font-medium">
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

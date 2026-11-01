import React from 'react';
import { HandoverStatus } from '../../lib/types';

interface HandoverStatusBadgeProps {
  status: HandoverStatus;
  size?: 'sm' | 'md';
}

export const HandoverStatusBadge: React.FC<HandoverStatusBadgeProps> = ({
  status,
  size = 'sm',
}) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm
    ? 'text-[12px] px-2 py-0.5'
    : 'text-[13px] px-2.5 py-1';

  switch (status) {
    case 'ACKNOWLEDGED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md border border-[#c2e4d0] bg-[#eaf5ef] text-[#1e7b4f] ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#1e7b4f]" />
          <span>Acknowledged</span>
        </span>
      );
    case 'SUBMITTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md border border-[#fde68a] bg-[#fef3c7] text-[#92400e] ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#b45309]" />
          <span>Pending Ack</span>
        </span>
      );
    case 'DRAFT':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md border border-[#e8eaec] bg-[#f0f1f2] text-[#5d5f60] ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#8c8f92]" />
          <span>Draft</span>
        </span>
      );
  }
};

import React from 'react';
import { IssueCategory } from '../../lib/types';

interface IssueCategoryBadgeProps {
  category: IssueCategory;
}

const getCategoryBadgeStyle = (cat: IssueCategory): React.CSSProperties => {
  switch (cat) {
    case 'EQUIPMENT':
      return { backgroundColor: '#f0fdf4', color: '#166534' };
    case 'MAINTENANCE':
      return { backgroundColor: '#fdf2f8', color: '#9d174d' };
    case 'INVENTORY':
      return { backgroundColor: '#f0f9ff', color: '#075985' };
    case 'SAFETY':
      return { backgroundColor: '#fef2f2', color: '#b91c1c' };
    case 'FACILITY':
      return { backgroundColor: '#fefce8', color: '#854d0e' };
    default:
      return { backgroundColor: '#f3f4f6', color: '#374151' };
  }
};

export const IssueCategoryBadge: React.FC<IssueCategoryBadgeProps> = ({ category }) => {
  return (
    <span
      style={{
        padding: '0.2rem 0.5rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 600,
        ...getCategoryBadgeStyle(category),
      }}
    >
      {category}
    </span>
  );
};

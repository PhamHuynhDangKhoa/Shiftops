import React from 'react';
import { IssueCategory } from '../../lib/types';
import { Badge } from '../ui/Badge';

interface IssueCategoryBadgeProps {
  category: IssueCategory;
  size?: 'sm' | 'md';
}

export const IssueCategoryBadge: React.FC<IssueCategoryBadgeProps> = ({ category, size = 'sm' }) => {
  return (
    <Badge variant="neutral" size={size} className="capitalize">
      {category.toLowerCase()}
    </Badge>
  );
};

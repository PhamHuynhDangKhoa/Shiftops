import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'none' | 'blue' | 'cyan' | 'red' | 'orange' | 'amber' | 'green' | 'gold';
  variant?: 'paper' | 'slate';
  compact?: boolean;
}

export const Card: React.FC<CardProps> = ({
  accent = 'none',
  variant = 'paper',
  compact = false,
  children,
  className = '',
  ...props
}) => {
  const accentStyles = {
    none: '',
    blue: 'border-l-3 border-l-[#2f70bb]',
    cyan: 'border-l-3 border-l-[#1b6c80]',
    red: 'border-l-3 border-l-[#c4242a]',
    orange: 'border-l-3 border-l-[#92400e]',
    amber: 'border-l-3 border-l-[#92400e]',
    green: 'border-l-3 border-l-[#1e7b4f]',
    gold: 'border-l-3 border-l-[#92400e]',
  };

  const variantStyles = {
    paper: 'bg-[#ffffff] border border-[#e8eaec] text-[#131416]',
    slate: 'bg-[#131416] border border-[#2a2f33] text-white',
  };

  const paddingStyle = compact ? 'p-4 sm:p-5' : 'p-6 sm:p-7';

  return (
    <div
      className={`relative rounded-xl ${variantStyles[variant]} ${paddingStyle} ${accentStyles[accent]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

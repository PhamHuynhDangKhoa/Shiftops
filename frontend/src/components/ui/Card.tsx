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
    blue: 'border-l-3 border-l-[#1a73e8]',
    cyan: 'border-l-3 border-l-[#e84534]',
    red: 'border-l-3 border-l-[#e84534]',
    orange: 'border-l-3 border-l-[#b06000]',
    amber: 'border-l-3 border-l-[#b06000]',
    green: 'border-l-3 border-l-[#137333]',
    gold: 'border-l-3 border-l-[#b06000]',
  };

  const variantStyles = {
    paper: 'bg-[#faf7f2] border border-[#ded7cc] text-[#181a1b]',
    slate: 'bg-[#1f2326] border border-[#31363a] text-white',
  };

  const paddingStyle = compact ? 'p-4 sm:p-5' : 'p-6 sm:p-7';

  return (
    <div
      className={`relative rounded-2xl ${variantStyles[variant]} ${paddingStyle} ${accentStyles[accent]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

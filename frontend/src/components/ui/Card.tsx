import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'none' | 'blue' | 'red' | 'orange' | 'green';
  compact?: boolean;
}

export const Card: React.FC<CardProps> = ({
  accent = 'none',
  compact = false,
  children,
  className = '',
  ...props
}) => {
  const accentStyles = {
    none: '',
    blue: 'border-l-2 border-l-zinc-900',
    red: 'border-l-2 border-l-rose-500',
    orange: 'border-l-2 border-l-amber-500',
    green: 'border-l-2 border-l-emerald-500',
  };

  const paddingStyle = compact ? 'p-3.5' : 'p-5';

  return (
    <div
      className={`bg-white border border-zinc-200 rounded-lg ${paddingStyle} ${accentStyles[accent]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

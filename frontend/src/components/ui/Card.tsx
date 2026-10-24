import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'none' | 'blue' | 'cyan' | 'red' | 'orange' | 'amber' | 'green' | 'gold';
  hazard?: 'none' | 'amber' | 'crimson' | 'cyan';
  compact?: boolean;
  chamfer?: boolean;
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
    blue: 'border-l-4 border-l-blue-500',
    cyan: 'border-l-4 border-l-emerald-500',
    red: 'border-l-4 border-l-rose-500',
    orange: 'border-l-4 border-l-amber-500',
    amber: 'border-l-4 border-l-amber-500',
    green: 'border-l-4 border-l-emerald-500',
    gold: 'border-l-4 border-l-amber-600',
  };

  const paddingStyle = compact ? 'p-3.5 sm:p-4' : 'p-5 sm:p-6';

  return (
    <div
      className={`relative bg-white border border-zinc-200/80 rounded-xl text-zinc-900 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)] transition-all ${paddingStyle} ${accentStyles[accent]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

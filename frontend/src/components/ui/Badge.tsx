import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'cyan' | 'urgent' | 'high' | 'normal' | 'low' | 'success' | 'warning' | 'gold' | 'neutral';
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  showDot = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 font-medium tabular-nums rounded-full border select-none whitespace-nowrap transition-colors';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] leading-tight',
    md: 'px-2.5 py-1 text-xs leading-tight',
  };

  const variantStyles = {
    brand: 'bg-blue-50 text-blue-700 border-blue-200/70',
    cyan: 'bg-teal-50 text-teal-700 border-teal-200/70',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200/70 font-semibold',
    high: 'bg-amber-50 text-amber-800 border-amber-200/70 font-medium',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/70 font-medium',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/70 font-medium',
    gold: 'bg-amber-50 text-amber-900 border-amber-300/70 font-semibold',
    normal: 'bg-blue-50 text-blue-700 border-blue-200/70',
    low: 'bg-zinc-100 text-zinc-600 border-zinc-200/70',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200/70',
  };

  const dotColor = {
    brand: 'bg-blue-500',
    cyan: 'bg-teal-500',
    urgent: 'bg-rose-500',
    high: 'bg-amber-500',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
    gold: 'bg-amber-600',
    normal: 'bg-blue-500',
    low: 'bg-zinc-400',
    neutral: 'bg-zinc-400',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor[variant]}`} />
      )}
      {children}
    </span>
  );
};

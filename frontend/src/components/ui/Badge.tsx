import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'urgent' | 'high' | 'normal' | 'low' | 'success' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center gap-1 font-medium rounded tabular-nums border transition-colors';

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[11px] leading-tight',
    md: 'px-2 py-0.5 text-xs leading-normal',
  };

  const variantStyles = {
    brand: 'bg-zinc-900 text-zinc-50 border-zinc-900 font-semibold',
    urgent: 'bg-rose-50 text-rose-800 border-rose-200/90 font-semibold',
    high: 'bg-amber-50 text-amber-800 border-amber-200/90 font-semibold',
    normal: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    low: 'bg-zinc-50 text-zinc-600 border-zinc-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 font-medium',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/90 font-medium',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'cyan' | 'urgent' | 'high' | 'normal' | 'low' | 'success' | 'warning' | 'gold' | 'neutral' | 'dark';
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
    'inline-flex items-center gap-1.5 font-medium tabular-nums rounded-md select-none whitespace-nowrap transition-colors';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs leading-tight',
    md: 'px-2.5 py-0.5 text-xs leading-tight',
  };

  const variantStyles = {
    brand: 'bg-[#e9f4f7] text-[#1b6c80] border border-[#1b6c80]/20 font-medium',
    cyan: 'bg-[#e9f4f7] text-[#1b6c80] border border-[#1b6c80]/20 font-medium',
    urgent: 'bg-[#ffedea] text-[#831c1e] border border-[#c4242a]/20 font-semibold',
    high: 'bg-[#fffbeb] text-[#92400e] border border-[#92400e]/20 font-medium',
    warning: 'bg-[#fffbeb] text-[#92400e] border border-[#92400e]/20 font-medium',
    success: 'bg-[#dcfae5] text-[#04250e] border border-[#1e7b4f]/20 font-medium',
    gold: 'bg-[#fffbeb] text-[#92400e] border border-[#92400e]/20 font-medium',
    normal: 'bg-[#ebedee] text-[#353736] border border-[#cdced1]',
    low: 'bg-[#ebedee] text-[#353736] border border-[#cdced1]',
    neutral: 'bg-[#ebedee] text-[#353736] border border-[#cdced1]',
    dark: 'bg-[#131416] text-white border border-[#2a2f33]',
  };

  const dotColor = {
    brand: 'bg-[#1b6c80]',
    cyan: 'bg-[#1b6c80]',
    urgent: 'bg-[#c4242a]',
    high: 'bg-[#92400e]',
    warning: 'bg-[#92400e]',
    success: 'bg-[#1e7b4f]',
    gold: 'bg-[#92400e]',
    normal: 'bg-[#5d5f60]',
    low: 'bg-[#5d5f60]',
    neutral: 'bg-[#5d5f60]',
    dark: 'bg-[#1b6c80]',
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

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
    'inline-flex items-center gap-1.5 font-medium tabular-nums rounded-full select-none whitespace-nowrap transition-colors';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs leading-tight',
    md: 'px-2.5 py-0.5 text-xs leading-tight',
  };

  const variantStyles = {
    brand: 'bg-[#fae8e5] text-[#e84534] border border-[#e84534]/25',
    cyan: 'bg-[#fae8e5] text-[#e84534] border border-[#e84534]/25',
    urgent: 'bg-[#fce8e6] text-[#c5221f] border border-[#c5221f]/25 font-semibold',
    high: 'bg-[#fef7e0] text-[#b06000] border border-[#b06000]/25 font-medium',
    warning: 'bg-[#fef7e0] text-[#b06000] border border-[#b06000]/25 font-medium',
    success: 'bg-[#e6f4ea] text-[#137333] border border-[#137333]/25 font-medium',
    gold: 'bg-[#fef7e0] text-[#b06000] border border-[#b06000]/25 font-medium',
    normal: 'bg-[#ece6dc] text-[#555048] border border-[#ded7cc]',
    low: 'bg-[#ece6dc] text-[#555048] border border-[#ded7cc]',
    neutral: 'bg-[#ece6dc] text-[#555048] border border-[#ded7cc]',
    dark: 'bg-[#1f2326] text-white border border-[#31363a]',
  };

  const dotColor = {
    brand: 'bg-[#e84534]',
    cyan: 'bg-[#e84534]',
    urgent: 'bg-[#c5221f]',
    high: 'bg-[#b06000]',
    warning: 'bg-[#b06000]',
    success: 'bg-[#137333]',
    gold: 'bg-[#b06000]',
    normal: 'bg-[#666159]',
    low: 'bg-[#666159]',
    neutral: 'bg-[#666159]',
    dark: 'bg-[#e84534]',
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

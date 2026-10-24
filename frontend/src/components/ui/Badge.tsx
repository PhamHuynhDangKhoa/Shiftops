import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'cyan' | 'urgent' | 'high' | 'normal' | 'low' | 'success' | 'warning' | 'gold' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-semibold tabular-nums border select-none whitespace-nowrap';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] leading-tight',
    md: 'px-2.5 py-1 text-[11px] leading-tight',
  };

  const variantStyles = {
    brand: 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/40 shadow-[0_0_8px_rgba(0,240,255,0.15)]',
    cyan: 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/40 shadow-[0_0_8px_rgba(0,240,255,0.15)]',
    urgent: 'bg-[#ff1744]/15 text-[#ff335c] border-[#ff1744]/50 shadow-[0_0_8px_rgba(255,23,68,0.2)]',
    high: 'bg-[#ff6b00]/15 text-[#ff8800] border-[#ff6b00]/50 shadow-[0_0_8px_rgba(255,107,0,0.15)]',
    warning: 'bg-[#ff6b00]/15 text-[#ff8800] border-[#ff6b00]/50 shadow-[0_0_8px_rgba(255,107,0,0.15)]',
    success: 'bg-[#00e676]/15 text-[#00e676] border-[#00e676]/40 shadow-[0_0_8px_rgba(0,230,118,0.15)]',
    gold: 'bg-[#e5c07b]/15 text-[#e5c07b] border-[#e5c07b]/40 shadow-[0_0_8px_rgba(229,192,123,0.15)]',
    normal: 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30',
    low: 'bg-[#181c24] text-[#9da8b9] border-[#262c38]',
    neutral: 'bg-[#181c24] text-[#9da8b9] border-[#262c38]',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} clip-tag ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

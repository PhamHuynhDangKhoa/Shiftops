import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'amber' | 'cyan' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  chamfer?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  chamfer = true,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-mono font-semibold uppercase tracking-wider select-none transition-all duration-150 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] whitespace-nowrap';

  const sizeStyles = {
    sm: 'h-8 px-3 text-[11px] gap-1.5',
    md: 'h-10 px-4 text-xs gap-2',
    lg: 'h-12 px-6 text-sm gap-2.5 font-bold',
  };

  const variantStyles = {
    // Primary: Rhodes Cyan Tactical switch
    primary:
      'bg-[#00f0ff] text-[#090a0d] hover:bg-[#38f3ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] active:bg-[#00c8b3] border border-[#00f0ff]',
    // Cyan explicit
    cyan:
      'bg-[#00f0ff] text-[#090a0d] hover:bg-[#38f3ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] active:bg-[#00c8b3] border border-[#00f0ff]',
    // Amber: Industrial safety warning
    amber:
      'bg-[#ff6b00] text-[#090a0d] hover:bg-[#ff8800] hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] active:bg-[#e05e00] border border-[#ff6b00]',
    // Secondary: Dark carbon substrate with crisp steel border and hover glow
    secondary:
      'bg-[#13151a] text-[#f1f5f9] border border-[#2a2f3d] hover:border-[#00f0ff] hover:text-[#00f0ff] hover:bg-[#1a1e27] active:bg-[#11141a]',
    // Danger: Hazard crimson alert
    danger:
      'bg-[#ff1744] text-white hover:bg-[#ff3d60] hover:shadow-[0_0_15px_rgba(255,23,68,0.4)] active:bg-[#d50028] border border-[#ff1744]',
    // Outline: Clean framing
    outline:
      'bg-transparent text-[#f1f5f9] border border-[#2a2f3d] hover:border-[#00f0ff] hover:text-[#00f0ff] hover:bg-[#00f0ff]/5',
    // Ghost: Minimal
    ghost:
      'bg-transparent text-[#9da8b9] hover:text-white hover:bg-[#181c24]',
  };

  const chamferClass = chamfer ? 'clip-chamfer-btn' : 'rounded-sm';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${chamferClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>SYS_BUSY...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

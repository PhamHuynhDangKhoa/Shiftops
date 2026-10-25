import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'amber' | 'cyan' | 'danger' | 'outline' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium select-none transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e84534] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:translate-y-px whitespace-nowrap rounded-xl';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-3.5 text-xs gap-2',
    lg: 'h-11 px-5 text-sm gap-2 font-bold',
  };

  const variantStyles = {
    primary:
      'bg-[#e84534] text-white hover:bg-[#d43827] border border-[#e84534] shadow-xs',
    secondary:
      'bg-[#faf7f2] text-[#181a1b] border border-[#ded7cc] hover:bg-[#f2ece4]',
    dark:
      'bg-[#1f2326] text-white border border-[#31363a] hover:bg-[#2a2f33]',
    cyan:
      'bg-[#e84534] text-white hover:bg-[#d43827] border border-[#e84534]',
    emerald:
      'bg-[#137333] text-white hover:bg-[#0d5926] border border-[#137333]',
    amber:
      'bg-[#b06000] text-white hover:bg-[#945100] border border-[#b06000]',
    danger:
      'bg-[#c5221f] text-white hover:bg-[#a61c19] border border-[#c5221f]',
    outline:
      'bg-transparent text-[#181a1b] border border-[#ded7cc] hover:bg-[#faf7f2]',
    ghost:
      'bg-transparent text-[#666159] hover:text-[#181a1b] hover:bg-[#ded7cc]/40 border border-transparent',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

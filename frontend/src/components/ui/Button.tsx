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
    'relative inline-flex items-center justify-center font-medium select-none transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1b6c80] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap rounded-md';

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-3.5 text-xs gap-2',
    lg: 'h-10 px-4 text-sm gap-2 font-medium',
  };

  const variantStyles = {
    primary:
      'bg-[#1b6c80] text-white hover:bg-[#155464] border border-[#1b6c80]',
    secondary:
      'bg-[#ffffff] text-[#131416] border border-[#cdced1] hover:bg-[#f4f6f8]',
    dark:
      'bg-[#131416] text-white border border-[#131416] hover:bg-[#1f2326]',
    cyan:
      'bg-[#1b6c80] text-white hover:bg-[#155464] border border-[#1b6c80]',
    emerald:
      'bg-[#1e7b4f] text-white hover:bg-[#165c3b] border border-[#1e7b4f]',
    amber:
      'bg-[#92400e] text-white hover:bg-[#78350f] border border-[#92400e]',
    danger:
      'bg-[#c4242a] text-white hover:bg-[#991b1b] border border-[#c4242a]',
    outline:
      'bg-transparent text-[#131416] border border-[#cdced1] hover:bg-[#f4f6f8]',
    ghost:
      'bg-transparent text-[#5d5f60] hover:text-[#131416] hover:bg-[#e8eaec]/60 border border-transparent',
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

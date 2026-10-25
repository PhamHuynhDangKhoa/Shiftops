import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#131416]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2 text-xs bg-[#ffffff] text-[#131416] placeholder:text-[#727477] border rounded-md transition-colors duration-150 focus:outline-none focus:border-[#1b6c80] focus:ring-1 focus:ring-[#1b6c80] ${
            error
              ? 'border-[#c4242a] focus:border-[#c4242a] focus:ring-[#c4242a]'
              : 'border-[#cdced1] hover:border-[#5d5f60]'
          } disabled:bg-[#f4f6f8] disabled:text-[#5d5f60] disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-xs text-[#c4242a]">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-[#5d5f60]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

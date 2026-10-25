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
          <label htmlFor={inputId} className="text-xs font-semibold text-[#181a1b]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2 text-xs bg-[#faf7f2] text-[#181a1b] placeholder:text-[#948e84] border rounded-xl transition-colors duration-150 focus:outline-none focus:border-[#e84534] focus:ring-1 focus:ring-[#e84534] ${
            error
              ? 'border-[#c5221f] focus:border-[#c5221f] focus:ring-[#c5221f]'
              : 'border-[#ded7cc] hover:border-[#666159]'
          } disabled:bg-[#f2ece4] disabled:text-[#666159] disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-xs text-[#c5221f]">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-[#666159]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

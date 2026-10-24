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
          <label htmlFor={inputId} className="text-xs font-medium text-zinc-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 text-sm bg-white text-zinc-900 placeholder:text-zinc-400 border rounded-lg shadow-2xs transition-all duration-150 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 ${
            error
              ? 'border-rose-300 focus:border-rose-600 focus:ring-rose-600'
              : 'border-zinc-300 hover:border-zinc-400'
          } disabled:bg-zinc-50 disabled:text-zinc-500 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-xs text-rose-600">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-zinc-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

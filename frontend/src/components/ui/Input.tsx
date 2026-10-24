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
          <label htmlFor={inputId} className="text-xs font-mono font-semibold uppercase tracking-wider text-[#9da8b9] flex items-center gap-1.5">
            <span className="text-[#00f0ff]">//</span>
            <span>{label}</span>
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2.5 text-xs font-mono bg-[#13151a] text-[#f1f5f9] placeholder:text-[#606c80] border transition-all duration-150 rounded-sm focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] focus:shadow-[0_0_10px_rgba(0,240,255,0.2)] ${
            error
              ? 'border-[#ff1744] focus:border-[#ff1744] focus:ring-[#ff1744] focus:shadow-[0_0_10px_rgba(255,23,68,0.2)]'
              : 'border-[#2a2f3d] hover:border-[#3c4558]'
          } disabled:bg-[#0c0d11] disabled:text-[#606c80] disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-[11px] font-mono text-[#ff335c] flex items-center gap-1">
            <span>[ERR]</span>
            <span>{error}</span>
          </span>
        ) : helperText ? (
          <span className="text-[11px] font-mono text-[#606c80]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

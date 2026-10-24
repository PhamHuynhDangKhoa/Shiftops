import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'none' | 'blue' | 'cyan' | 'red' | 'orange' | 'amber' | 'green' | 'gold';
  hazard?: 'none' | 'amber' | 'crimson' | 'cyan';
  compact?: boolean;
  chamfer?: boolean;
}

export const Card: React.FC<CardProps> = ({
  accent = 'none',
  hazard = 'none',
  compact = false,
  chamfer = false,
  children,
  className = '',
  ...props
}) => {
  const accentStyles = {
    none: '',
    blue: 'border-l-2 border-l-[#00f0ff]',
    cyan: 'border-l-2 border-l-[#00f0ff]',
    red: 'border-l-2 border-l-[#ff1744]',
    orange: 'border-l-2 border-l-[#ff6b00]',
    amber: 'border-l-2 border-l-[#ff6b00]',
    green: 'border-l-2 border-l-[#00e676]',
    gold: 'border-l-2 border-l-[#e5c07b]',
  };

  const paddingStyle = compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5';
  const chamferClass = chamfer ? 'clip-chamfer-card' : '';

  return (
    <div
      className={`relative bg-[#11141a] border border-[#262c38] text-[#f1f5f9] shadow-sm ${paddingStyle} ${accentStyles[accent]} ${chamferClass} ${className}`}
      {...props}
    >
      {/* Top Hazard Stripe Ribbon if requested */}
      {hazard === 'amber' && (
        <div className="absolute top-0 left-0 right-0 h-1 hazard-stripes-amber" />
      )}
      {hazard === 'crimson' && (
        <div className="absolute top-0 left-0 right-0 h-1 hazard-stripes-crimson" />
      )}
      {hazard === 'cyan' && (
        <div className="absolute top-0 left-0 right-0 h-1 hazard-stripes-cyan" />
      )}

      {children}
    </div>
  );
};

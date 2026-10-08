import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: 'none' | 'blue' | 'red' | 'orange' | 'green';
}

export const Card: React.FC<CardProps> = ({
  accent = 'none',
  children,
  className = '',
  ...props
}) => {
  const accentStyles = {
    none: '',
    blue: 'border-l-4 border-l-blue-600',
    red: 'border-l-4 border-l-red-500',
    orange: 'border-l-4 border-l-orange-500',
    green: 'border-l-4 border-l-emerald-500',
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${accentStyles[accent]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

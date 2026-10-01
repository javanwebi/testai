import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  padding = 'md',
  ...props
}) => {
  const paddingMap = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-7',
  };

  return (
    <div
      className={`bg-white rounded-[12px] border border-[#CBD2D8] shadow-[0_1px_3px_rgba(10,23,47,0.05)] ${
        hoverEffect ? 'transition-all duration-200 hover:shadow-[0_4px_12px_rgba(10,23,47,0.08)] hover:border-slate-300' : ''
      } ${paddingMap[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

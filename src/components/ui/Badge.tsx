import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'navy' | 'success' | 'danger' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    brand: 'bg-[#FFEDD5] text-[#C95210] border border-orange-200 font-medium',
    navy: 'bg-[#55565A] text-white font-medium',
    success: 'bg-emerald-50 text-[#16A34A] border border-emerald-200 font-medium',
    danger: 'bg-red-50 text-[#DC2626] border border-red-200 font-medium',
    warning: 'bg-amber-50 text-[#F59E0B] border border-amber-200 font-medium',
    neutral: 'bg-slate-100 text-[#777A7D] border border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md tracking-normal whitespace-nowrap ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

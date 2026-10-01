import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'soft' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06518]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 h-8',
    md: 'px-4 py-2 text-sm gap-2 h-10',
    lg: 'px-6 py-2.5 text-base gap-2.5 h-12',
  };

  const variantStyles = {
    primary: 'bg-[#E06518] text-white hover:bg-[#C95210] shadow-sm active:bg-[#C2410C]',
    secondary: 'bg-[#1B293E] text-white hover:bg-[#55565A] shadow-sm',
    outline: 'border border-[#CBD2D8] text-[#55565A] bg-white hover:bg-[#DEE2E5] active:bg-[#DEE2E5]',
    soft: 'bg-[#FFEDD5] text-[#C95210] hover:bg-[#FED7AA] font-semibold',
    danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-sm',
    ghost: 'text-[#55565A] hover:bg-slate-100',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ml-2" />
      ) : null}
      {children}
    </button>
  );
};

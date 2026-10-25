import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export default function Button({ children, variant = 'primary', fullWidth = false, className = '', ...props }: ButtonProps) {
  const baseStyle = "py-3 px-4 rounded-xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-md",
    outline: "border-2 border-brand-500 text-brand-500 hover:bg-brand-50",
    ghost: "text-gray-500 hover:bg-gray-100",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} {...props}>
      {children}
    </button>
  );
}
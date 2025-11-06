import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className = '', variant = 'default', ...props }) => {
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
    destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    outline: 'border border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-100'
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`} 
      {...props} 
    />
  );
};
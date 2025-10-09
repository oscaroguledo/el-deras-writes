import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}, ref) => {
  return <div className={cn('mb-4', fullWidth && 'w-full')}>
        {label && <label htmlFor={props.id} className="block text-sm font-medium text-main mb-1">
            {label}
          </label>}
        <div className="relative">
          {leftIcon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              {leftIcon}
            </div>}
          <input ref={ref} className={cn('w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 transition-colors', leftIcon && 'pl-10', rightIcon && 'pr-10', error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-primary focus:ring-primary', className)} {...props} />
          {rightIcon && <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
              {rightIcon}
            </div>}
        </div>
        {error ? <p className="mt-1 text-sm text-red-500">{error}</p> : helperText ? <p className="mt-1 text-sm text-gray-500">{helperText}</p> : null}
      </div>;
});
Input.displayName = 'Input';
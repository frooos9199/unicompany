'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute top-1/2 -translate-y-1/2 start-3 text-[var(--foreground-secondary)]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 rounded-xl
              bg-[var(--background-secondary)] border border-[var(--border)]
              text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)]
              focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent
              transition-all duration-200
              ${icon ? 'ps-10' : ''}
              ${error ? 'border-[var(--error)] focus:ring-[var(--error)]' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-[var(--error)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

'use client';

import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';

interface MoneyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  currency?: string;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ currency = 'RD$', className, ...props }, ref) => {
    return (
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
          {currency}
        </span>
        <Input
          ref={ref}
          type="number"
          min="0"
          step="0.01"
          className={`pl-10 ${className ?? ''}`}
          {...props}
        />
      </div>
    );
  },
);
MoneyInput.displayName = 'MoneyInput';

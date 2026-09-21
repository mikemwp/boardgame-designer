import * as React from 'react';
import { cn } from 'cn';

function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-8 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-sm text-slate-50 outline-none',
        className,
      )}
      {...props}
    />
  );
}

export { Input };

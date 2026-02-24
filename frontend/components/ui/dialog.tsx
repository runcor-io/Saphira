'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const Dialog = ({ children, open, onOpenChange }: { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50 bg-white rounded-2xl shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('p-6', className)}>{children}</div>
);

const DialogHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('mb-4', className)}>{children}</div>
);

const DialogTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn('text-lg font-semibold text-charcoal', className)}>{children}</h2>
);

const DialogDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={cn('text-sm text-gray-500 mt-1', className)}>{children}</p>
);

const DialogTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  return <>{children}</>;
};

const DialogFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('flex justify-end gap-3 mt-6 pt-4 border-t', className)}>{children}</div>
);

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
};

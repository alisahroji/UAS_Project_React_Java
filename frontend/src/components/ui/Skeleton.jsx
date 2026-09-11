import React from 'react';
import { cn } from '../../utils/cn';

export function Skeleton({ className, ...props }) {
  return (
    <div className={cn('animate-pulse bg-slate-200 rounded-md', className)} {...props} />
  );
}

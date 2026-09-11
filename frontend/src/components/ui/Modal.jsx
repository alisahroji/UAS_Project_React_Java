import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  actionButton,
  className
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div className={cn(
        "relative bg-surface rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]",
        className
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          {title && (
            <h3 id="modal-title" className="text-lg font-semibold text-text-main">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-main transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-sm p-1 ml-auto"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="px-6 py-4 overflow-y-auto">
          {children}
        </div>
        
        {actionButton && (
          <div className="px-6 py-4 bg-surface-elevated border-t border-border flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
}

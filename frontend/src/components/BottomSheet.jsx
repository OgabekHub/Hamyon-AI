import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function BottomSheet({ isOpen, onClose, title, children }) {
  // Disable body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sheet Container */}
      <div 
        className="relative w-full max-w-md glass rounded-t-[28px] px-5 pb-8 pt-3 border-t border-[rgba(59,158,248,0.20)] shadow-[0_-8px_32px_rgba(13,27,75,0.40)] pointer-events-auto animate-slide-up"
        style={{ background: 'var(--color-bg)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Drag Handle indicator */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-1.5 rounded-full bg-gray-500/20" />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl transition-all duration-200"
            style={{ 
              background: 'rgba(59,158,248,0.06)', 
              border: '1px solid rgba(59,158,248,0.15)',
              color: 'var(--color-muted)' 
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

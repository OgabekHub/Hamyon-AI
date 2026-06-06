import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto animate-fade-in"
        onClick={onClose}
      />
      
      {/* Centered Modal Container */}
      <div 
        className="relative w-full max-w-sm glass rounded-[32px] px-5 pb-6 pt-5 border border-[rgba(59,158,248,0.22)] shadow-[0_12px_40px_rgba(13,27,75,0.50)] pointer-events-auto animate-scale-in z-50"
        style={{ background: 'var(--color-bg)', maxHeight: '85vh', overflowY: 'auto' }}
      >
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

  return createPortal(content, document.body);
}

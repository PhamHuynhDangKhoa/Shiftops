import React, { useEffect } from 'react';
import { IconClose } from './Icons';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidthStyles[maxWidth]} bg-[#11141a] border border-[#2a2f3d] shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] flex flex-col clip-chamfer-card`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tactical Header Bar */}
        <div className="relative flex items-center justify-between px-5 py-3.5 border-b border-[#2a2f3d] bg-[#161922]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#00f0ff] inline-block shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
            <div>
              <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2">
                <span>{title}</span>
              </h3>
              {description && (
                <p className="text-[11px] font-mono text-[#9da8b9] mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-[#9da8b9] hover:text-[#00f0ff] hover:bg-[#1f2430] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <IconClose size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto text-[#f1f5f9] text-xs">
          {children}
        </div>
      </div>
    </div>
  );
};

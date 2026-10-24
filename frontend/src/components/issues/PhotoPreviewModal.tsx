import React, { useEffect } from 'react';
import { IconClose } from '../ui/Icons';

interface PhotoPreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  imageUrl,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (imageUrl) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white border border-zinc-200/90 rounded-2xl p-4 overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-1 pb-3 border-b border-zinc-100 mb-3">
          <span className="text-sm font-bold text-zinc-900">Photo Attachment</span>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md hover:bg-zinc-100 cursor-pointer transition-colors"
          >
            <IconClose size={18} />
          </button>
        </div>
        <img
          src={imageUrl}
          alt="Attachment preview"
          className="max-h-[75vh] w-auto object-contain rounded-lg border border-zinc-100"
        />
      </div>
    </div>
  );
};

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white border border-zinc-200 rounded-lg p-2 overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-2 py-1.5 border-b border-zinc-100 mb-2">
          <span className="text-xs font-mono text-zinc-500">Incident Photo Evidence</span>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded hover:bg-zinc-100 cursor-pointer transition-colors"
          >
            <IconClose size={16} />
          </button>
        </div>
        <img
          src={imageUrl}
          alt="Evidence attachment"
          className="max-h-[80vh] w-auto object-contain rounded"
        />
      </div>
    </div>
  );
};

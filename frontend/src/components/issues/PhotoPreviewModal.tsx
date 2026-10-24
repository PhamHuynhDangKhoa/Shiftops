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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-[#11141a] border border-[#262c38] rounded-sm p-3 overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-1 py-1 border-b border-[#262c38] mb-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Photo Evidence</span>
          <button
            onClick={onClose}
            className="text-[#8a94a6] hover:text-white p-1 rounded hover:bg-[#181c24] cursor-pointer transition-colors"
          >
            <IconClose size={16} />
          </button>
        </div>
        <img
          src={imageUrl}
          alt="Evidence attachment"
          className="max-h-[80vh] w-auto object-contain rounded-sm border border-[#262c38]"
        />
      </div>
    </div>
  );
};

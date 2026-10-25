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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131416]/60 transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white border border-[#e8eaec] rounded-xl p-4 overflow-hidden shadow-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-1 pb-3 border-b border-[#f0f1f2] mb-3">
          <span className="text-xs font-semibold text-[#131416]">Photo attachment</span>
          <button
            onClick={onClose}
            className="text-[#5d5f60] hover:text-[#131416] p-1 rounded-md hover:bg-[#ebedee] cursor-pointer transition-colors"
          >
            <IconClose size={16} />
          </button>
        </div>
        <img
          src={imageUrl}
          alt="Attachment preview"
          className="max-h-[75vh] w-auto object-contain rounded-md border border-[#e8eaec]"
        />
      </div>
    </div>
  );
};

import React from 'react';

interface PhotoPreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  imageUrl,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-40px',
            right: '0',
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '1.75rem',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
        <img
          src={imageUrl}
          alt="Issue evidence"
          style={{
            maxWidth: '100%',
            maxHeight: '85vh',
            borderRadius: '8px',
            objectFit: 'contain',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    </div>
  );
};

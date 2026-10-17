import React from 'react';
import { Branch, IssueCategory, IssuePriority } from '../../lib/types';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  branches?: Branch[];
  branchId: string;
  onBranchIdChange: (branchId: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  category: IssueCategory;
  onCategoryChange: (category: IssueCategory) => void;
  priority: IssuePriority;
  onPriorityChange: (priority: IssuePriority) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  isOwner,
  branches,
  branchId,
  onBranchIdChange,
  title,
  onTitleChange,
  category,
  onCategoryChange,
  priority,
  onPriorityChange,
  description,
  onDescriptionChange,
  onFileChange,
  onSubmit,
  isPending,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          maxWidth: '560px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>
            ⚠️ Report Operational Issue
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9ca3af' }}
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* Branch Selector for Owner */}
          {isOwner && branches && (
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                Branch:
              </label>
              <select
                value={branchId}
                onChange={(e) => onBranchIdChange(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                required
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
              Issue Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Steam wand leak, POS offline, Freezer warming up"
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>

          {/* Category & Priority grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => onCategoryChange(e.target.value as IssueCategory)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="EQUIPMENT">Equipment</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="INVENTORY">Inventory</option>
                <option value="SAFETY">Safety</option>
                <option value="FACILITY">Facility</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
                Priority *
              </label>
              <select
                value={priority}
                onChange={(e) => onPriorityChange(e.target.value as IssuePriority)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">🚨 URGENT (Immediate Hazard/Blocker)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
              Description & Observations *
            </label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={4}
              placeholder="Describe what occurred, any hazard present, equipment model, and immediate actions taken..."
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>

          {/* Optional Photo Attachment */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
              Attach Photo (Optional - max 5MB, JPG/PNG/WebP)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onFileChange(e.target.files[0]);
                }
              }}
              style={{ fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isPending ? 'Submitting...' : 'Submit Issue Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

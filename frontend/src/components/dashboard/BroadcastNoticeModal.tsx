import React, { useState } from 'react';
import { AnnouncementTargetType } from '../../lib/types';
import { Modal, Input, Button } from '../ui';

export interface BroadcastNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  onSubmit: (data: {
    title: string;
    content: string;
    targetType: AnnouncementTargetType;
  }) => void;
  isSubmitting: boolean;
  error: string | null;
}

export const BroadcastNoticeModal: React.FC<BroadcastNoticeModalProps> = ({
  isOpen,
  onClose,
  isOwner,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetType, setTargetType] = useState<AnnouncementTargetType>('BRANCH');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      targetType,
    });
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setTargetType('BRANCH');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Broadcast Store Operations Notice"
      description="Publish an immediate announcement bulletin to on-duty and upcoming staff"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-[#c4242a] bg-[#ffedea] border border-[#c4242a]/20 rounded-md">
            {error}
          </div>
        )}

        <Input
          label="Notice Headline *"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Health Inspection at 14:00, Floor Coverage Alert"
        />

        {isOwner && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#131416]">
              Target Audience
            </label>
            <select
              value={targetType}
              onChange={(e) =>
                setTargetType(e.target.value as AnnouncementTargetType)
              }
              className="w-full px-3 py-2 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] focus:outline-none focus:border-[#1b6c80] focus:ring-1 focus:ring-[#1b6c80]"
            >
              <option value="BRANCH">Current Branch Only</option>
              <option value="ORGANIZATION">Organization-Wide (All Stores)</option>
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#131416]">
            Notice Content *
          </label>
          <textarea
            required
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter operational briefing, requirements, or staff safety notices..."
            className="w-full px-3 py-2 text-xs rounded-md border border-[#cdced1] bg-white text-[#131416] placeholder:text-[#727477] focus:outline-none focus:border-[#1b6c80] focus:ring-1 focus:ring-[#1b6c80]"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f0f1f2]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="dark"
            size="sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Broadcasting...' : 'Publish Bulletin'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

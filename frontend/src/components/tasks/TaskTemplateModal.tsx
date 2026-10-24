import React from 'react';
import { TaskPriority } from '../../lib/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { IconPlus, IconClose } from '../ui/Icons';

export interface TemplateDraftItem {
  title: string;
  description: string;
  priority: TaskPriority;
  orderIndex: number;
}

interface TaskTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  name: string;
  onChangeName: (name: string) => void;
  description: string;
  onChangeDescription: (desc: string) => void;
  items: TemplateDraftItem[];
  onChangeItems: (items: TemplateDraftItem[]) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export const TaskTemplateModal: React.FC<TaskTemplateModalProps> = ({
  isOpen,
  onClose,
  isEditing,
  name,
  onChangeName,
  description,
  onChangeDescription,
  items,
  onChangeItems,
  onSubmit,
  isPending,
}) => {
  const handleAddItem = () => {
    onChangeItems([
      ...items,
      { title: '', description: '', priority: 'NORMAL', orderIndex: items.length },
    ]);
  };

  const handleUpdateItemTitle = (index: number, title: string) => {
    const updated = [...items];
    const cur = updated[index];
    if (cur) {
      cur.title = title;
      onChangeItems(updated);
    }
  };

  const handleUpdateItemPriority = (index: number, priority: TaskPriority) => {
    const updated = [...items];
    const cur = updated[index];
    if (cur) {
      cur.priority = priority;
      onChangeItems(updated);
    }
  };

  const handleRemoveItem = (index: number) => {
    onChangeItems(items.filter((_, i) => i !== index));
  };

  const isSaveDisabled =
    !name.trim() || items.some((it) => !it.title.trim()) || isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Task Template' : 'Create Task Template'}
      description="Define standard checklist routine items to dispatch across shifts"
      maxWidth="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4 font-mono"
      >
        <Input
          label="Template Name"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="e.g. Opening Shift Checklist"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase text-[#8a94a6]">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            rows={2}
            placeholder="Operational purpose or scope..."
            className="w-full px-3 py-2 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white placeholder:text-[#606c80] focus:outline-none focus:border-[#00f0ff]"
          />
        </div>

        {/* Checklist Items Editor */}
        <div className="pt-2">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#262c38]">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Checklist Items ({items.length})
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddItem}
              className="gap-1 text-xs"
            >
              <IconPlus size={12} />
              <span>Add Item</span>
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#8a94a6] font-mono border border-dashed border-[#262c38] rounded-sm">
              No items in this template yet. Click "Add Item" above.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-[#161922] border border-[#262c38] rounded-sm">
                  <span className="text-[11px] font-mono text-[#8a94a6] w-5 text-right">{idx + 1}.</span>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleUpdateItemTitle(idx, e.target.value)}
                    placeholder="Item title..."
                    required
                    className="flex-1 px-2.5 py-1 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                  <select
                    value={item.priority}
                    onChange={(e) => handleUpdateItemPriority(idx, e.target.value as TaskPriority)}
                    className="px-2 py-1 text-xs font-mono rounded-sm border border-[#2a2f3d] bg-[#13151a] text-white focus:outline-none focus:border-[#00f0ff]"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-[#8a94a6] hover:text-[#ff335c] cursor-pointer p-1 transition-colors"
                  >
                    <IconClose size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[#262c38]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSaveDisabled}
          >
            {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Template'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

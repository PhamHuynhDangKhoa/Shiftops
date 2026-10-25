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
        className="space-y-4"
      >
        <Input
          label="Template Name"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="e.g. Opening Shift Checklist"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-700">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            rows={2}
            placeholder="Overview of this checklist routine..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 shadow-2xs"
          />
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[#131416]">
              Checklist items ({items.length})
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddItem}
              className="gap-1 text-xs"
            >
              <IconPlus size={13} />
              <span>Add Item</span>
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-zinc-300 text-center text-xs text-zinc-500">
              No items added yet. Click &quot;Add Item&quot; to build checklist steps.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200/80 rounded-lg text-sm"
                >
                  <span className="text-xs font-semibold text-zinc-400 w-5 text-center">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleUpdateItemTitle(idx, e.target.value)}
                    placeholder="Item title (e.g. Turn on espresso machine)"
                    className="flex-1 px-2.5 py-1 text-sm rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                    required
                  />
                  <select
                    value={item.priority}
                    onChange={(e) => handleUpdateItemPriority(idx, e.target.value as TaskPriority)}
                    className="px-2 py-1 text-xs rounded-md border border-zinc-300 bg-white text-zinc-900 focus:outline-none focus:border-zinc-900"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                  >
                    <IconClose size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200">
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

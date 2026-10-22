import React from 'react';
import { TaskTemplate } from '../../lib/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IconCheckList, IconPlus } from '../ui/Icons';

interface TaskTemplateListProps {
  templates?: TaskTemplate[];
  isLoading: boolean;
  onOpenCreate: () => void;
  onOpenEdit: (template: TaskTemplate) => void;
  onToggleStatus: (templateId: string, active: boolean) => void;
}

export const TaskTemplateList: React.FC<TaskTemplateListProps> = ({
  templates = [],
  isLoading,
  onOpenCreate,
  onOpenEdit,
  onToggleStatus,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-zinc-200">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">
            Checklist Templates
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Standard operating procedures and routines for shift personnel
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenCreate}
          className="gap-1.5"
        >
          <IconPlus size={14} />
          <span>New Template</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs font-mono text-zinc-400">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-zinc-200 rounded-lg bg-zinc-50/50">
          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto mb-2">
            <IconCheckList size={16} />
          </div>
          <p className="text-xs font-medium text-zinc-800">No task templates configured</p>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Create standard operating procedures (e.g. Opening, Closing, Cleanliness).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col justify-between gap-3 hover:border-zinc-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-zinc-950 truncate">{tpl.name}</h3>
                    {tpl.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{tpl.description}</p>
                    )}
                  </div>
                  <Badge variant={tpl.active ? 'success' : 'neutral'} size="sm">
                    {tpl.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="pt-1">
                  <div className="text-[11px] font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Checklist Items ({tpl.items?.length || 0})
                  </div>
                  <div className="space-y-1">
                    {tpl.items?.slice(0, 3).map((item, idx) => (
                      <div key={item.id || idx} className="text-xs text-zinc-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                    {(tpl.items?.length || 0) > 3 && (
                      <span className="text-[11px] font-mono text-zinc-400 block pl-3">
                        + {(tpl.items?.length || 0) - 3} more items
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenEdit(tpl)}
                >
                  Edit Items
                </Button>

                <Button
                  variant={tpl.active ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() => onToggleStatus(tpl.id, !tpl.active)}
                >
                  {tpl.active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

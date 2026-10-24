import React from 'react';
import { TaskTemplate } from '../../lib/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
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
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-zinc-200/80">
        <div>
          <h2 className="text-base font-bold text-zinc-900">
            Checklist Templates (SOP)
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Standard checklist routines that can be generated for scheduled shifts
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
        <div className="py-12 text-center text-sm text-zinc-500 bg-white border border-zinc-200/80 rounded-xl">
          Loading templates...
        </div>
      ) : templates.length === 0 ? (
        <div className="py-12 text-center border border-zinc-200/80 bg-white rounded-xl shadow-xs">
          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mx-auto mb-2">
            <IconCheckList size={18} />
          </div>
          <p className="text-sm font-semibold text-zinc-800">No checklist templates found</p>
          <p className="text-xs text-zinc-500 mt-1">
            Create standard operating procedures (e.g. Opening Shift, Closing, Deep Clean).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <Card
              key={tpl.id}
              className="flex flex-col justify-between gap-3 p-5 hover:border-zinc-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-zinc-900 truncate">{tpl.name}</h3>
                    {tpl.description && (
                      <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{tpl.description}</p>
                    )}
                  </div>
                  <Badge variant={tpl.active ? 'success' : 'neutral'} size="sm" showDot>
                    {tpl.active ? 'Active' : 'Archived'}
                  </Badge>
                </div>

                <div className="pt-2">
                  <div className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                    Routine Steps ({tpl.items?.length || 0})
                  </div>
                  <div className="space-y-1.5">
                    {tpl.items?.slice(0, 3).map((item, idx) => (
                      <div key={item.id || idx} className="text-xs text-zinc-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                    {(tpl.items?.length || 0) > 3 && (
                      <span className="text-xs text-zinc-400 block pl-3.5">
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
                  Edit Template
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(tpl.id, !tpl.active)}
                  className="text-xs"
                >
                  {tpl.active ? 'Archive' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

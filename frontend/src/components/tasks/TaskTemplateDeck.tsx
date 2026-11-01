import React from 'react';
import { TaskTemplate } from '../../lib/types';
import { Badge } from '../ui/Badge';
import { IconCheckList, IconPlus, IconLayers } from '../ui/Icons';

interface TaskTemplateDeckProps {
  templates: TaskTemplate[];
  isLoading: boolean;
  onOpenCreate: () => void;
  onOpenEdit: (template: TaskTemplate) => void;
  onToggleStatus: (templateId: string, active: boolean) => void;
  onQuickGenerate: (template: TaskTemplate) => void;
}

export const TaskTemplateDeck: React.FC<TaskTemplateDeckProps> = ({
  templates,
  isLoading,
  onOpenCreate,
  onOpenEdit,
  onToggleStatus,
  onQuickGenerate,
}) => {
  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-[#5d5f60] bg-white border border-[#e8eaec] rounded-lg">
        Loading SOP checklist templates...
      </div>
    );
  }

  return (
    <div className="space-y-4" id="panel-templates" role="tabpanel" aria-labelledby="tab-templates">
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[#e8eaec]">
        <div>
          <h2 className="text-sm font-bold text-[#131416]">
            Standard Operating Procedure (SOP) Templates
          </h2>
          <p className="text-xs text-[#5d5f60] mt-0.5">
            Standard checklists automatically propagated across shift schedules
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="h-8 px-3 rounded-md text-xs font-medium bg-[#1b6c80] text-white hover:bg-[#155666] transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#1b6c80] focus-visible:ring-offset-1"
        >
          <IconPlus size={13} className="text-white" />
          <span>New SOP Template</span>
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="py-16 text-center border border-[#e8eaec] bg-white rounded-lg p-6">
          <div className="w-10 h-10 bg-[#f4f6f8] rounded-full flex items-center justify-center text-[#5d5f60] mx-auto mb-2">
            <IconCheckList size={18} />
          </div>
          <p className="text-sm font-semibold text-[#131416]">No SOP templates created yet</p>
          <p className="text-xs text-[#5d5f60] mt-1">
            Establish standard procedures (e.g. Opening Shift, Closing, Food Safety, Cleaning).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-white border border-[#e8eaec] rounded-lg p-4 flex flex-col justify-between gap-3 hover:border-[#cdced1] transition-colors duration-150"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-[#131416] truncate">{tpl.name}</h3>
                    {tpl.description && (
                      <p className="text-xs text-[#5d5f60] mt-0.5 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={tpl.active ? 'success' : 'neutral'} size="sm" showDot>
                    {tpl.active ? 'Active' : 'Archived'}
                  </Badge>
                </div>

                {/* SOP Steps preview */}
                <div className="pt-2 border-t border-[#f0f1f2]">
                  <div className="text-[11px] font-medium text-[#5d5f60] mb-1.5">
                    Procedure Items ({tpl.items?.length || 0})
                  </div>
                  <div className="space-y-1.5">
                    {tpl.items?.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="text-xs text-[#131416] flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1b6c80] flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                    {(tpl.items?.length || 0) > 3 && (
                      <span className="text-[11px] text-[#898b8d] block pl-3.5">
                        + {(tpl.items?.length || 0) - 3} additional procedure steps
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-[#f0f1f2] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenEdit(tpl)}
                    className="h-7 px-2.5 rounded text-xs font-medium bg-white border border-[#cdced1] text-[#131416] hover:bg-[#f4f6f8] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1b6c80]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onToggleStatus(tpl.id, !tpl.active)}
                    className="h-7 px-2.5 rounded text-xs font-medium bg-white border border-[#cdced1] text-[#5d5f60] hover:bg-[#f4f6f8] transition-colors cursor-pointer"
                  >
                    {tpl.active ? 'Archive' : 'Activate'}
                  </button>
                </div>

                <button
                  onClick={() => onQuickGenerate(tpl)}
                  className="h-7 px-2.5 rounded text-xs font-medium bg-[#f0f7f8] text-[#1b6c80] border border-[#d2e8ed] hover:bg-[#e2f1f4] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <IconLayers size={11} />
                  <span>Generate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

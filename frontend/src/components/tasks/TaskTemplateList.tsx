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
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[#262c38]">
        <div>
          <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            STANDARD OPERATING PROCEDURES (SOP) TEMPLATES
          </h2>
          <p className="text-xs font-mono text-[#9da8b9] mt-0.5">
            Routine mission checklists automatically deployed to sector shifts
          </p>
        </div>

        <Button
          variant="amber"
          size="sm"
          onClick={onOpenCreate}
          className="gap-2"
        >
          <IconPlus size={14} />
          <span>[ NEW TEMPLATE ]</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs font-mono text-[#00f0ff]">[ SYNCING_TEMPLATES... ]</div>
      ) : templates.length === 0 ? (
        <div className="py-12 text-center border border-[#262c38] bg-[#11141a] clip-chamfer-card">
          <div className="w-8 h-8 bg-[#181c24] border border-[#262c38] flex items-center justify-center text-[#606c80] mx-auto mb-2">
            <IconCheckList size={16} />
          </div>
          <p className="text-xs font-mono font-bold text-white uppercase">[ NO SOP TEMPLATES CONFIGURED ]</p>
          <p className="text-[11px] font-mono text-[#606c80] mt-0.5">
            Create standard operational directives (e.g. Sector Opening, Closing, Cleanliness).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-[#11141a] border border-[#262c38] p-4 flex flex-col justify-between gap-3 clip-chamfer-card hover:border-[#384152] transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-mono font-bold text-sm text-white uppercase truncate">{tpl.name}</h3>
                    {tpl.description && (
                      <p className="text-xs font-mono text-[#9da8b9] mt-0.5 leading-relaxed">// {tpl.description}</p>
                    )}
                  </div>
                  <Badge variant={tpl.active ? 'success' : 'neutral'} size="sm">
                    {tpl.active ? 'DEPLOYED' : 'STANDBY'}
                  </Badge>
                </div>

                <div className="pt-1">
                  <div className="text-[10px] font-mono font-bold text-[#606c80] mb-2 uppercase tracking-wider">
                    DIRECTIVE PROTOCOLS ({tpl.items?.length || 0})
                  </div>
                  <div className="space-y-1 font-mono">
                    {tpl.items?.slice(0, 3).map((item, idx) => (
                      <div key={item.id || idx} className="text-xs text-[#f1f5f9] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#00f0ff] flex-shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                    {(tpl.items?.length || 0) > 3 && (
                      <span className="text-[10px] font-mono text-[#606c80] block pl-3.5">
                        + {(tpl.items?.length || 0) - 3} MORE PROTOCOLS
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e222b] flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onOpenEdit(tpl)}
                >
                  [ EDIT PROTOCOLS ]
                </Button>

                <Button
                  variant={tpl.active ? 'danger' : 'secondary'}
                  size="sm"
                  onClick={() => onToggleStatus(tpl.id, !tpl.active)}
                >
                  {tpl.active ? '[ DEACTIVATE ]' : '[ ACTIVATE ]'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

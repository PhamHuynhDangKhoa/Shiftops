import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconGripVertical,
  IconInbox,
  IconCheckCircle2,
  IconLayers,
  IconListFilter,
  IconSearch,
} from '../components/ui/Icons';

interface ChecklistItem {
  id: string;
  title: string;
  time: string;
  done: boolean;
  assignee: string;
}

interface StaffMember {
  name: string;
  role: string;
  status: 'On duty' | 'On break' | 'Scheduled';
  time: string;
  isLead?: boolean;
}

interface UndoState {
  id: string;
  title: string;
  prevDone: boolean;
}

export const DashboardPage: React.FC = () => {
  // Live Clock state for SVG Analog Clock
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Hover telemetry state for Analog Clock card
  const [isClockHovered, setIsClockHovered] = useState(false);

  // Filter state for checklist: 'PENDING' | 'DONE' | 'ALL'
  const [checklistFilter, setChecklistFilter] = useState<'PENDING' | 'DONE' | 'ALL'>('PENDING');

  // Search filter query received from the top bar or global search
  const [searchQuery, setSearchQuery] = useState('');

  // Selected staff filter
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string | null>(null);

  // Collapsible Accordion sections in Pane 3
  const [isOverdueOpen, setIsOverdueOpen] = useState(true);
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(true);
  const [isVerifiedOpen, setIsVerifiedOpen] = useState(false);

  // Search & filter controlled input and ref
  const [quickAddText, setQuickAddText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard focus & cursor state
  const [focusedTaskId, setFocusedTaskId] = useState<string>('t8');

  // Satisfying completion physics: IDs animating completion for 380ms
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  // Undo toast state & timer ref
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Inline assignee popover
  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);
  const reassignPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFilterSearch = (e: Event) => {
      const ce = e as CustomEvent<string>;
      setSearchQuery(ce.detail || '');
    };
    const handleFocusSearch = () => {
      searchInputRef.current?.focus();
    };
    window.addEventListener('shiftops:filter-search', handleFilterSearch);
    window.addEventListener('shiftops:focus-search', handleFocusSearch);
    return () => {
      window.removeEventListener('shiftops:filter-search', handleFilterSearch);
      window.removeEventListener('shiftops:focus-search', handleFocusSearch);
    };
  }, []);

  // Operational checklist items
  const [shiftChecklist, setShiftChecklist] = useState<ChecklistItem[]>([
    {
      id: 't1',
      title: 'Opening perimeter security & entrance key disarm',
      time: '08:00',
      done: true,
      assignee: 'Marcus T.',
    },
    {
      id: 't2',
      title: 'Register float & cash drawer count',
      time: '08:15',
      done: true,
      assignee: 'Elena H.',
    },
    {
      id: 't3',
      title: 'POS terminal & barcode scanner connectivity test',
      time: '08:30',
      done: true,
      assignee: 'Elena H.',
    },
    {
      id: 't4',
      title: 'Main entrance display restock and merchandising',
      time: '09:00',
      done: true,
      assignee: 'Marcus T.',
    },
    {
      id: 't5',
      title: 'Perishable goods refrigeration temperature audit',
      time: '09:30',
      done: true,
      assignee: 'Jordan K.',
    },
    {
      id: 't6',
      title: 'Aisle hazard check & spill station inspection',
      time: '10:00',
      done: true,
      assignee: 'Aoi T.',
    },
    {
      id: 't7',
      title: 'Bakery & warm food display sensor confirmation',
      time: '10:30',
      done: true,
      assignee: 'Maya L.',
    },
    {
      id: 't8',
      title: 'Customer checkout queue cover & break relief',
      time: '11:00',
      done: false,
      assignee: 'Elena H.',
    },
    {
      id: 't9',
      title: 'Dairy cooler stock level & FIFO rotation review',
      time: '11:30',
      done: false,
      assignee: 'Carlos G.',
    },
    {
      id: 't10',
      title: 'Curbside pickup order staging & dispatch review',
      time: '11:45',
      done: false,
      assignee: 'Chloe D.',
    },
    {
      id: 't11',
      title: 'Produce freshness audit & misting nozzle check',
      time: '12:15',
      done: false,
      assignee: 'Maya L.',
    },
    {
      id: 't12',
      title: 'Midday register drop & cash envelope safe transfer',
      time: '12:30',
      done: false,
      assignee: 'Marcus T.',
    },
    {
      id: 't13',
      title: 'Restroom sanitation & consumable supplies audit',
      time: '13:15',
      done: false,
      assignee: 'Carlos G.',
    },
    {
      id: 't14',
      title: 'Returns desk triage & defective item quarantine',
      time: '13:45',
      done: false,
      assignee: 'Elena H.',
    },
    {
      id: 't15',
      title: 'High-touch surface sanitization & basket restocking',
      time: '14:00',
      done: false,
      assignee: 'Jordan K.',
    },
    {
      id: 't16',
      title: 'Afternoon bakery replenishment & hot case logging',
      time: '14:30',
      done: false,
      assignee: 'Maya L.',
    },
    {
      id: 't17',
      title: 'Inventory delivery dock intake & invoice check',
      time: '15:00',
      done: false,
      assignee: 'Kenji S.',
    },
    {
      id: 't18',
      title: 'Promotional signage & shelf price tags verification',
      time: '15:30',
      done: false,
      assignee: 'Aoi T.',
    },
    {
      id: 't19',
      title: 'Aisle recovery & shopping cart return sweep',
      time: '16:00',
      done: false,
      assignee: 'Jordan K.',
    },
    {
      id: 't20',
      title: 'Evening register float reconcile & safe drop count',
      time: '16:15',
      done: false,
      assignee: 'Marcus T.',
    },
    {
      id: 't21',
      title: 'Perimeter security & delivery dock closure audit',
      time: '16:30',
      done: false,
      assignee: 'Elena H.',
    },
  ]);

  // Staff on duty state
  const [floorStaff, setFloorStaff] = useState<StaffMember[]>([
    { name: 'Marcus Tanaka', role: 'Store Supervisor', status: 'On duty', time: '08:00–16:30', isLead: true },
    { name: 'Elena Rostova', role: 'Cashier & Front Desk', status: 'On duty', time: '08:00–16:30' },
    { name: 'Jordan Kim', role: 'Inventory & Floor', status: 'On break', time: '08:30–17:00' },
    { name: 'Kenji Sato', role: 'Customer Service', status: 'On duty', time: '09:00–17:30' },
    { name: 'Aoi Takahashi', role: 'Merchandising Lead', status: 'On duty', time: '08:00–16:30' },
    { name: 'Carlos Gomez', role: 'Stockroom Receiving', status: 'On duty', time: '07:30–16:00' },
    { name: 'Maya Lin', role: 'Bakery & Deli Lead', status: 'On duty', time: '06:30–15:00' },
    { name: 'Devon Brooks', role: 'Cash Office & Safe Audit', status: 'On duty', time: '08:00–16:30' },
    { name: 'Chloe Dubois', role: 'Curbside Fulfillment', status: 'Scheduled', time: '11:00–19:30' },
    { name: 'Sarah Jenkins', role: 'Incoming Shift Lead', status: 'Scheduled', time: '16:30–01:00' },
  ]);

  const onDutyCount = floorStaff.filter((s) => s.status === 'On duty').length;
  const onDutyStaff = floorStaff.filter((s) => s.status === 'On duty');

  const toggleStaffBreak = (index: number) => {
    setFloorStaff((prev) =>
      prev.map((s, idx) => {
        if (idx !== index) return s;
        const nextStatus = s.status === 'On duty' ? 'On break' : s.status === 'On break' ? 'On duty' : s.status;
        return { ...s, status: nextStatus };
      })
    );
  };

  // Filter staff by global search query
  const filteredStaff = floorStaff.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q);
  });

  // Reassign task handler
  const handleReassign = (taskId: string, staffFullName: string) => {
    const parts = staffFullName.trim().split(' ');
    const first = parts[0] || staffFullName;
    const secondInitial = parts[1] ? `${parts[1][0]}.` : '';
    const formatted = secondInitial ? `${first} ${secondInitial}` : first;
    setShiftChecklist((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, assignee: formatted } : item))
    );
    setReassigningTaskId(null);
  };

  // Close reassign popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reassignPopoverRef.current && !reassignPopoverRef.current.contains(e.target as Node)) {
        setReassigningTaskId(null);
      }
    };
    if (reassigningTaskId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [reassigningTaskId]);

  // Toggle completion with 380ms physics & undo toast
  const handleToggleChecklist = (id: string) => {
    const targetTask = shiftChecklist.find((t) => t.id === id);
    if (!targetTask) return;

    if (!targetTask.done) {
      // Mark as completing (for 380ms animation)
      setCompletingIds((prev) => new Set(prev).add(id));
      setTimeout(() => {
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setShiftChecklist((prev) =>
          prev.map((item) => (item.id === id ? { ...item, done: true } : item))
        );
        triggerUndoToast(id, targetTask.title, false);
      }, 380);
    } else {
      // Revert from verified back to pending
      setShiftChecklist((prev) =>
        prev.map((item) => (item.id === id ? { ...item, done: false } : item))
      );
      triggerUndoToast(id, targetTask.title, true);
    }
  };

  const triggerUndoToast = (id: string, title: string, prevDone: boolean) => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    setUndoState({ id, title, prevDone });
    undoTimerRef.current = setTimeout(() => {
      setUndoState(null);
    }, 4000);
  };

  const handleUndo = () => {
    if (!undoState) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    setShiftChecklist((prev) =>
      prev.map((t) => (t.id === undoState.id ? { ...t, done: undoState.prevDone } : t))
    );
    setUndoState(null);
  };

  // Cmd+Z / Ctrl+Z keyboard undo
  useEffect(() => {
    const handleUndoKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && undoState) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleUndoKey);
    return () => window.removeEventListener('keydown', handleUndoKey);
  }, [undoState]);

  // Focus quick-add on '/' shortcut
  useEffect(() => {
    const handleSlashKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleSlashKey);
    return () => window.removeEventListener('keydown', handleSlashKey);
  }, []);

  // Smart Natural-Language Quick Add
  const handleQuickAdd = () => {
    let text = quickAddText.trim();
    if (!text) return;

    // 1. Extract time (e.g. 14:30 or 9:15)
    const timeRegex = /\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/;
    const timeMatch = text.match(timeRegex);
    let parsedTime = '';
    if (timeMatch) {
      parsedTime = timeMatch[0].length === 4 ? `0${timeMatch[0]}` : timeMatch[0];
      text = text.replace(timeRegex, '').trim();
    } else {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0'); /* taste-skill-ignore */
      const mm = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0'); /* taste-skill-ignore */
      parsedTime = `${hh}:${mm}`;
    }

    // 2. Extract @Mention (e.g. @Elena or @Marcus)
    const mentionRegex = /@([a-zA-Z]+)/;
    const mentionMatch = text.match(mentionRegex);
    let parsedAssignee = 'Unassigned';
    if (mentionMatch && mentionMatch[1]) {
      const mentionQuery = mentionMatch[1].toLowerCase();
      const matched = floorStaff.find((s) => s.name.toLowerCase().includes(mentionQuery));
      if (matched) {
        const parts = matched.name.split(' ');
        const first = parts[0] || matched.name;
        const secondInitial = parts[1] ? `${parts[1][0]}.` : '';
        parsedAssignee = secondInitial ? `${first} ${secondInitial}` : first;
      } else {
        parsedAssignee = `${mentionMatch[1]}.`;
      }
      text = text.replace(mentionRegex, '').trim();
    }

    // Clean up spaces
    text = text.replace(/\s+/g, ' ').trim();
    if (!text) {
      text = 'Routine task';
    }

    const newId = `t-new-${Date.now()}`;
    const newItem: ChecklistItem = {
      id: newId,
      title: text,
      time: parsedTime,
      done: false,
      assignee: parsedAssignee,
    };

    setShiftChecklist((prev) => [newItem, ...prev]);
    setQuickAddText('');
    setFocusedTaskId(newId);
  };

  const completedCount = shiftChecklist.filter((t) => t.done).length;
  const pendingCount = shiftChecklist.length - completedCount;

  // Filter tasks
  const filteredTasks = shiftChecklist.filter((t) => {
    if (checklistFilter === 'PENDING' && t.done) return false;
    if (checklistFilter === 'DONE' && !t.done) return false;

    if (selectedStaffFilter) {
      const firstName = selectedStaffFilter.split(' ')[0] || '';
      if (firstName && !t.assignee.startsWith(firstName)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchAssignee = t.assignee.toLowerCase().includes(q);
      const matchTime = t.time.includes(q);
      if (!matchTitle && !matchAssignee && !matchTime) return false;
    }

    return true;
  });

  // Split into Overdue (< 13:00 and not done), Upcoming (>= 13:00 and not done), and Verified (done)
  // Tasks actively completing for 380ms stay temporarily in their section for satisfying physics
  const overdueTasks = filteredTasks.filter((t) => (!t.done || completingIds.has(t.id)) && t.time < '13:00');
  const upcomingTasks = filteredTasks.filter((t) => (!t.done || completingIds.has(t.id)) && t.time >= '13:00');
  const verifiedTasks = filteredTasks.filter((t) => t.done && !completingIds.has(t.id));

  // Active visible tasks according to filter and accordions
  const visibleTasks = [
    ...(isOverdueOpen ? overdueTasks : []),
    ...(isUpcomingOpen ? upcomingTasks : []),
    ...(isVerifiedOpen ? verifiedTasks : []),
  ];

  // Keyboard navigation for ArrowUp/Down and Space
  useEffect(() => {
    const handleKeyboardNav = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (isInput) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        if (visibleTasks.length === 0) return;
        const currentIndex = visibleTasks.findIndex((t) => t.id === focusedTaskId);
        const nextIndex = currentIndex < visibleTasks.length - 1 ? currentIndex + 1 : 0;
        const target = visibleTasks[nextIndex];
        if (target) {
          setFocusedTaskId(target.id);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        if (visibleTasks.length === 0) return;
        const currentIndex = visibleTasks.findIndex((t) => t.id === focusedTaskId);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : visibleTasks.length - 1;
        const target = visibleTasks[prevIndex];
        if (target) {
          setFocusedTaskId(target.id);
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (focusedTaskId) {
          handleToggleChecklist(focusedTaskId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyboardNav);
    return () => window.removeEventListener('keydown', handleKeyboardNav);
  }, [visibleTasks, focusedTaskId]);

  // Clock Hand Angles for SVG
  const hours = currentTime.getHours() % 12;
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const hourAngle = (hours + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  // Formatted date and hour for clock card
  const hour12 = currentTime.getHours() % 12 || 12;
  const ampm = currentTime.getHours() >= 12 ? 'pm' : 'am';
  const formattedHour = `${hour12}${ampm}`;

  const getOrdinalDate = (date: Date) => {
    const day = date.getDate();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const suffix = (day >= 11 && day <= 13) ? 'th' : ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'][day % 10] || 'th';
    return `${dayName}, ${day}${suffix} ${monthName}`;
  };

  // Mobile segmented tab for switching between Routines and Floor/Clock on small screens
  const [mobileTab, setMobileTab] = useState<'routines' | 'planner'>('routines');

  // Dynamic contextual SOP guidelines for the Task Detail card
  const getTaskGuideline = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('perimeter') || lower.includes('security') || lower.includes('disarm')) {
      return 'Inspect physical lock hardware, disarm perimeter zone alarm, and log key sign-in sheet.';
    }
    if (lower.includes('cash') || lower.includes('drawer') || lower.includes('float') || lower.includes('safe')) {
      return 'Count base denomination till float ($350.00) and verify register security seal integrity.';
    }
    if (lower.includes('pos') || lower.includes('scanner') || lower.includes('terminal')) {
      return 'Execute test barcode scan and verify thermal receipt roll inventory across all active checkout lanes.';
    }
    if (lower.includes('refrigeration') || lower.includes('temperature') || lower.includes('dairy') || lower.includes('perishable')) {
      return 'Inspect cold-chain temp (34°F–38°F) in HACCP log and rotate inventory using FIFO protocol.';
    }
    if (lower.includes('curbside') || lower.includes('staging') || lower.includes('dispatch')) {
      return 'Stage pending customer order bins and verify vehicle stall readiness for midday dispatch window.';
    }
    if (lower.includes('queue') || lower.includes('checkout') || lower.includes('break')) {
      return 'Relieve front cashier for scheduled 15-min rest break and balance queues across open lanes.';
    }
    if (lower.includes('sanitation') || lower.includes('restroom') || lower.includes('hazard')) {
      return 'Walk main customer aisles, clear transit obstacles, and replenish consumable hygiene dispensers.';
    }
    return 'Execute standard operating procedure for this station and record verification in shift log.';
  };

  // Unified task row renderer ensuring identical tactile craft across sections
  const renderTaskRow = (task: ChecklistItem, isVerifiedSection: boolean = false) => {
    const isFocused = task.id === focusedTaskId;
    const isCompleting = completingIds.has(task.id);
    const isDone = (task.done || isCompleting) && !undoState?.prevDone;

    return (
      <div
        key={task.id}
        onMouseEnter={() => setFocusedTaskId(task.id)}
        onClick={() => handleToggleChecklist(task.id)}
        className={`group rounded-[11px] p-1.5 pr-4 flex items-center gap-2.5 mb-2 transition-colors cursor-pointer relative ${
          isFocused
            ? 'bg-[#DFE7F0] bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.4)_0px,rgba(255,255,255,0.4)_1.5px,transparent_1.5px,transparent_5px)] shadow-[inset_1.5px_1.5px_1px_rgba(255,255,255,0.9),0_3px_6px_-1px_rgba(15,23,42,0.06)] /* taste-skill-ignore */'
            : isVerifiedSection
            ? 'bg-[#E3EAF2]/60 hover:bg-[#E3EAF2]/80 shadow-[inset_1.5px_1.5px_1px_rgba(255,255,255,0.6),0_2px_4px_-1px_rgba(15,23,42,0.04)] /* taste-skill-ignore */'
            : 'bg-[#E3EAF2]/90 hover:bg-[#DCE4EE] shadow-[inset_1.5px_1.5px_1px_rgba(255,255,255,0.85),0_3px_6px_-1px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] /* taste-skill-ignore */'
        }`}
      >
        <IconGripVertical
          size={16}
          className={`w-4 h-4 ml-1.5 shrink-0 opacity-100 transition-colors ${
            isFocused ? 'text-[#1E293B]' : 'text-[#64748B]'
          }`}
        />

        {/* Tier 2: Inner Matte Keycap — Directional Top-Left Highlight & Soft Bottom Shadow (rounded-[8px]) */}
        <div className="bg-[#F8FAFC] px-2.5 py-1 rounded-[8px] shadow-[inset_1.5px_1.5px_0.5px_#FFFFFF,0_2px_5px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)] flex items-center gap-1.5 shrink-0 select-none /* taste-skill-ignore */">
          <div
            className={`w-[14px] h-[14px] rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
              isDone
                ? 'border-[1.25px] border-[#0F172A] bg-[#0F172A] text-white'
                : 'border-[1.25px] border-[#475569]'
            } ${isCompleting ? 'scale-105' : ''}`}
          >
            {isDone ? (
              <IconCheck size={8} className="stroke-[2.5]" />
            ) : (
              <IconCheck size={8} className="text-[#475569] stroke-[2]" />
            )}
          </div>
          <span
            className={`font-sans text-[13px] font-normal tabular-nums ${
              isDone ? 'text-[#64748B]' : 'text-[#1E293B]'
            }`}
          >
            {task.time}
          </span>
        </div>

        {/* Task Title (Soft Normal Weight) */}
        <span
          className={`text-sm font-normal flex-1 min-w-0 truncate transition-colors ${
            isDone ? 'text-[#64748B] line-through' : 'text-[#334155]'
          }`}
        >
          {task.title}
        </span>

        {/* Assignee & Inline Quick-Switch Popover */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setReassigningTaskId(reassigningTaskId === task.id ? null : task.id);
            }}
            className="text-[13px] font-normal text-[#475569] hover:text-[#0F172A] px-2 py-0.5 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
            title="Click to reassign staff"
            aria-label={`Reassign task currently assigned to ${task.assignee}`}
          >
            {task.assignee}
          </button>

          {reassigningTaskId === task.id && (
            <div
              ref={reassignPopoverRef}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1.5 z-40 bg-[#F8FAFC] rounded-2xl p-1.5 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08),0_2px_6px_-1px_rgba(15,23,42,0.04)] border border-white min-w-[155px] space-y-0.5 /* taste-skill-ignore */"
            >
              <div className="px-2 py-1 text-[11px] font-medium text-[#475569]">
                On duty staff
              </div>
              {onDutyStaff.map((staff) => {
                const parts = staff.name.split(' ');
                const first = parts[0] || staff.name;
                const isCurrent = task.assignee.startsWith(first);
                return (
                  <button
                    key={staff.name}
                    type="button"
                    onClick={() => handleReassign(task.id, staff.name)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-[#E2E8F0] text-[#0F172A] font-semibold'
                        : 'text-[#334155] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">{staff.name}</span>
                      {staff.isLead && (
                        <span className="text-[11px] px-1 py-0.2 rounded bg-[#0F172A] text-white shrink-0">
                          Lead
                        </span>
                      )}
                    </div>
                    {isCurrent && <IconCheck size={12} className="text-[#0F172A] shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Dynamic focused task binding for the floating 3D Task Detail card
  const focusedTask = shiftChecklist.find((t) => t.id === focusedTaskId) || shiftChecklist[0];
  const focusedAssigneeStaff = floorStaff.find(
    (s) => focusedTask && s.name.startsWith(focusedTask.assignee.split(' ')[0] || '')
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-3 h-full overflow-hidden">
      {/* Mobile-only view switcher pill */}
      <div className="md:hidden flex items-center p-1 bg-[#E2E8F0]/70 rounded-2xl shrink-0" role="tablist" aria-label="Mobile View Switcher">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'routines'}
          onClick={() => setMobileTab('routines')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            mobileTab === 'routines'
              ? 'bg-white text-[#0F172A] shadow-xs font-semibold'
              : 'text-[#475569]'
          }`}
        >
          <span>Shift Routines</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#E5EBF1] font-semibold tabular-nums">
            {pendingCount}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'planner'}
          onClick={() => setMobileTab('planner')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            mobileTab === 'planner'
              ? 'bg-white text-[#0F172A] shadow-xs font-semibold'
              : 'text-[#475569]'
          }`}
        >
          <span>Clock & Team</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#E5EBF1] font-semibold tabular-nums">
            {onDutyCount}
          </span>
        </button>
      </div>

      {/* Pane 2: Left Context & Time Column (Top-Left Corner Only, Fade Out Right & Down) */}
      <section
        aria-label="Shift Planner"
        className={`w-full md:w-[270px] lg:w-[305px] shrink-0 bg-[linear-gradient(135deg,rgba(226,234,240,0.85)_0%,rgba(232,238,246,0.4)_45%,rgba(238,242,248,0)_100%)] rounded-tl-[28px] p-3.5 sm:p-4 lg:p-4.5 flex flex-col gap-3.5 border-t border-l border-white/80 shadow-[inset_2px_2px_5px_rgba(15,23,42,0.03)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] /* taste-skill-ignore */ ${
          mobileTab === 'planner' ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Section Title */}
        <h2 className="text-[17px] font-medium tracking-[-0.01em] text-[#1E293B] px-1 leading-none">
          Shift Planner
        </h2>

        {/* Soft Interactive Filter Stack: Only active filter shows right-aligned count */}
        <div className="flex flex-col gap-1" role="tablist" aria-label="Task Filter Views">
          {/* 1. Pending Filter */}
          {checklistFilter === 'PENDING' ? (
            <button
              type="button"
              role="tab"
              aria-selected="true"
              onClick={() => setChecklistFilter('PENDING')}
              className="bg-white rounded-[11px] px-3.5 py-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.07),0_1px_3px_rgba(15,23,42,0.04),inset_0_1.5px_0_#FFFFFF] border border-white flex items-center justify-between text-[13px] font-medium text-[#1E293B] cursor-pointer /* taste-skill-ignore */"
            >
              <div className="flex items-center gap-2">
                <IconInbox size={16} className="text-[#475569]" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-[6px] bg-[#DDE4EE] text-[#1E293B] font-medium tabular-nums">
                  {pendingCount}
                </span>
                <IconChevronRight size={14} className="text-[#475569]" />
              </div>
            </button>
          ) : (
            <button
              type="button"
              role="tab"
              aria-selected="false"
              onClick={() => {
                setChecklistFilter('PENDING');
                setIsOverdueOpen(true);
                setIsUpcomingOpen(true);
              }}
              className="px-3.5 py-2 text-[13px] text-[#475569] hover:bg-white/50 rounded-[11px] transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <IconInbox size={16} className="text-[#475569]" />
                <span>Pending</span>
              </div>
            </button>
          )}

          {/* 2. Verified Filter */}
          {checklistFilter === 'DONE' ? (
            <button
              type="button"
              role="tab"
              aria-selected="true"
              onClick={() => setChecklistFilter('DONE')}
              className="bg-white rounded-[11px] px-3.5 py-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.07),0_1px_3px_rgba(15,23,42,0.04),inset_0_1.5px_0_#FFFFFF] border border-white flex items-center justify-between text-[13px] font-medium text-[#1E293B] cursor-pointer /* taste-skill-ignore */"
            >
              <div className="flex items-center gap-2">
                <IconCheckCircle2 size={16} className="text-[#475569]" />
                <span>Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-[6px] bg-[#DDE4EE] text-[#1E293B] font-medium tabular-nums">
                  {completedCount}
                </span>
                <IconChevronRight size={14} className="text-[#475569]" />
              </div>
            </button>
          ) : (
            <button
              type="button"
              role="tab"
              aria-selected="false"
              onClick={() => {
                setChecklistFilter('DONE');
                setIsVerifiedOpen(true);
              }}
              className="px-3.5 py-2 text-[13px] text-[#475569] hover:bg-white/50 rounded-[11px] transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <IconCheckCircle2 size={16} className="text-[#475569]" />
                <span>Verified</span>
              </div>
            </button>
          )}

          {/* 3. All Tasks Filter */}
          {checklistFilter === 'ALL' ? (
            <button
              type="button"
              role="tab"
              aria-selected="true"
              onClick={() => setChecklistFilter('ALL')}
              className="bg-white rounded-[11px] px-3.5 py-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.07),0_1px_3px_rgba(15,23,42,0.04),inset_0_1.5px_0_#FFFFFF] border border-white flex items-center justify-between text-[13px] font-medium text-[#1E293B] cursor-pointer /* taste-skill-ignore */"
            >
              <div className="flex items-center gap-2">
                <IconLayers size={16} className="text-[#475569]" />
                <span>All</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-[6px] bg-[#DDE4EE] text-[#1E293B] font-medium tabular-nums">
                  {shiftChecklist.length}
                </span>
                <IconChevronRight size={14} className="text-[#475569]" />
              </div>
            </button>
          ) : (
            <button
              type="button"
              role="tab"
              aria-selected="false"
              onClick={() => {
                setChecklistFilter('ALL');
                setIsOverdueOpen(true);
                setIsUpcomingOpen(true);
                setIsVerifiedOpen(true);
              }}
              className="px-3.5 py-2 text-[13px] text-[#475569] hover:bg-white/50 rounded-[11px] transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <IconLayers size={16} className="text-[#475569]" />
                <span>All</span>
              </div>
            </button>
          )}
        </div>

        {/* Rimless SVG Analog Clock Card (Minimal 12-Hour Dial with Left-Aligned Time Beside It) */}
        <div
          onMouseEnter={() => setIsClockHovered(true)}
          onMouseLeave={() => setIsClockHovered(false)}
          className="bg-white rounded-[24px] px-4 py-4 sm:px-5 border border-white shadow-[0_7px_22px_-4px_rgba(15,23,42,0.08),0_2px_6px_-1px_rgba(15,23,42,0.04),inset_0_1.5px_0_#FFFFFF] flex items-end justify-start gap-3.5 h-[156px] shrink-0 cursor-default /* taste-skill-ignore */"
        >
          {/* Left: Rimless SVG Clock with 12 hour ticks + subtle minute dots */}
          <div className="w-[114px] h-[114px] lg:w-[122px] lg:h-[122px] shrink-0 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* 12 Delicate Hour Ticks (No spiky black spikes) */}
              {Array.from({ length: 12 }).map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="8"
                  x2="50"
                  y2="12"
                  stroke="#94A3B8"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  transform={`rotate(${i * 30} 50 50)`}
                />
              ))}

              {/* 48 Delicate Minute Dots */}
              {Array.from({ length: 60 })
                .filter((_, i) => i % 5 !== 0)
                .map((_, i) => (
                  <circle
                    key={i}
                    cx="50"
                    cy="9.5"
                    r="0.65"
                    fill="#CBD5E1"
                    transform={`rotate(${i * 6} 50 50)`}
                  />
                ))}

              {/* Hour hand (Sleek needle with rounded cap) */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="28"
                stroke="#1E293B"
                strokeWidth="2.2"
                strokeLinecap="round"
                transform={`rotate(${hourAngle} 50 50)`}
              />

              {/* Minute hand */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="17"
                stroke="#1E293B"
                strokeWidth="1.5"
                strokeLinecap="round"
                transform={`rotate(${minuteAngle} 50 50)`}
              />

              {/* Thin Second hand */}
              <line
                x1="50"
                y1="54"
                x2="50"
                y2="13"
                stroke="#CBD5E1"
                strokeWidth="0.8"
                strokeLinecap="round"
                transform={`rotate(${secondAngle} 50 50)`}
              />

              {/* Center Cap */}
              <circle cx="50" cy="50" r="2.5" fill="#1E293B" />
            </svg>
          </div>

          {/* Right: Left-aligned typography pulled comfortably beside the clock dial */}
          <div className="ml-1 mb-1 text-left flex flex-col justify-end select-none min-w-0">
            <span className="text-[20px] font-medium text-[#0F172A] leading-none tracking-tight tabular-nums">
              {formattedHour}
            </span>
            {isClockHovered ? (
              <div className="mt-1.5 flex flex-col items-start">
                <span className="text-xs font-medium text-[#475569] whitespace-nowrap">
                  2h 15m left
                </span>
                <div className="w-24 h-1 bg-[#DCE4EC] rounded-full mt-1 overflow-hidden">
                  <div className="w-[68%] h-full bg-[#0F172A] rounded-full" />
                </div>
              </div>
            ) : (
              <div className="mt-1.5 flex flex-col items-start">
                <span className="text-[12px] text-[#475569] whitespace-nowrap leading-tight">
                  {getOrdinalDate(currentTime)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Floor Coverage Card (Crisp White Card with Deep Navy Selection) */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-2 text-[13px] font-medium text-[#475569] mb-1.5">
            <span>Floor Coverage</span>
            <span className="font-semibold text-[#0F172A] tabular-nums">
              {onDutyCount} On Duty
            </span>
          </div>

          <div
            className="bg-white rounded-[24px] p-3 border border-white shadow-[0_7px_22px_-4px_rgba(15,23,42,0.08),0_2px_6px_-1px_rgba(15,23,42,0.04),inset_0_1.5px_0_#FFFFFF] flex-1 min-h-0 flex flex-col overflow-hidden /* taste-skill-ignore */"
          >
            <div
              className="flex-1 overflow-y-auto space-y-1 pr-1 pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              role="list"
              aria-label="Floor Staff"
            >
              {filteredStaff.map((staff, idx) => {
                const isSelected = selectedStaffFilter === staff.name;
                return (
                  <div
                    key={idx}
                    role="listitem"
                    onClick={() => setSelectedStaffFilter(isSelected ? null : staff.name)}
                    className={`p-2 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#DDE5F0]/80 rounded-[10px] shadow-[inset_0_2px_4px_rgba(15,23,42,0.10),inset_0_1px_1px_rgba(15,23,42,0.06),0_1px_0_#FFFFFF] border border-[#CBD5E1]/60 /* taste-skill-ignore */'
                        : 'rounded-[10px] hover:bg-[#F1F5F9]/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium truncate text-[#0F172A]">
                          {staff.name}
                        </span>
                        {staff.isLead && (
                          <span className="bg-[#0F172A] text-white text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-tight shrink-0">
                            Lead
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#475569] block truncate mt-0.5">
                        {staff.role}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] tabular-nums text-[#475569] block">
                        {staff.time}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStaffBreak(idx);
                        }}
                        className="text-[11px] font-medium text-[#475569] hover:text-[#0F172A] cursor-pointer transition-colors"
                        title="Click to toggle status"
                      >
                        {staff.status}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2.5 mt-auto border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#475569] shrink-0 px-1 bg-transparent">
              <span>{onDutyCount} on duty</span>
              <Link to="/staff" className="font-semibold text-[#0F172A] hover:underline">
                Full directory →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pane 3: Tinted Recessed Checklist Canvas (Top-Left Corner Only, Fade Out Right & Down) */}
      <section
        aria-label="Shift Routines and Checklist"
        className={`flex-1 bg-[linear-gradient(135deg,rgba(226,234,240,0.85)_0%,rgba(232,238,246,0.4)_45%,rgba(238,242,248,0)_100%)] rounded-tl-[28px] p-4 sm:p-6 lg:p-7 flex flex-col overflow-hidden border-t border-l border-white/80 shadow-[inset_2px_2px_5px_rgba(15,23,42,0.03)] relative /* taste-skill-ignore */ ${
          mobileTab === 'routines' ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Canvas Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-[17px] font-medium tracking-[-0.01em] text-[#1E293B] leading-none">
            Shift Routines
          </h1>
        </div>

        {/* Sub-header Context with Compact Tactile Staff Filter Pill */}
        <div className="flex items-center gap-1.5 text-xs text-[#475569] mb-3.5">
          <IconListFilter size={14} className="text-[#475569]" />
          <span className="font-normal text-[#475569]">Routines</span>
          <span className="font-medium text-[#1E293B]">
            {checklistFilter === 'PENDING' ? 'Pending' : checklistFilter === 'DONE' ? 'Verified' : 'All'}
          </span>
          {selectedStaffFilter && (
            <button
              type="button"
              onClick={() => setSelectedStaffFilter(null)}
              className="ml-2 bg-white text-[#1E293B] px-2.5 py-0.5 rounded-[8px] shadow-[0_2px_6px_rgba(15,23,42,0.04)] text-xs font-medium flex items-center gap-1.5 cursor-pointer hover:bg-white/90 border border-white/80 transition-colors /* taste-skill-ignore */"
              aria-label={`Clear filter for ${selectedStaffFilter}`}
            >
              <span>{selectedStaffFilter}</span>
              <span className="text-[#475569] hover:text-[#1E293B] font-bold text-xs leading-none">×</span>
            </button>
          )}
        </div>

        {/* Task List Column (Elongated to max-w-[620px]) & Floating 3D Task Detail Card */}
        <div className="flex-1 flex gap-6 overflow-hidden min-h-0 relative z-10">
          <div className="w-full max-w-[620px] flex flex-col min-h-0 shrink-0">
            {/* Punched-Down Search & Filter Routines Bar */}
            <div
              onClick={() => searchInputRef.current?.focus()}
          className="w-full h-10 rounded-[11px] bg-[#D8E1EC]/75 border border-[#C5D1E0]/80 shadow-[inset_0_2px_4px_rgba(15,23,42,0.08),0_1px_0_rgba(255,255,255,0.9)] px-3 flex items-center mb-3.5 shrink-0 focus-within:ring-1 focus-within:ring-[#1E293B]/20 transition-colors cursor-text relative select-none /* taste-skill-ignore */"
        >
          <IconSearch size={14} className="text-[#475569] shrink-0 mr-2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setSearchQuery('');
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (searchQuery.trim().toLowerCase().startsWith('add ') || searchQuery.includes('@')) {
                  setQuickAddText(searchQuery.replace(/^add\s+/i, ''));
                  handleQuickAdd();
                  setSearchQuery('');
                }
              }
            }}
            placeholder="Search routines or filter by @staff..."
            aria-label="Search routines or filter by staff"
            className="w-full h-full bg-transparent border-none text-[13px] text-[#1E293B] focus:outline-none z-10 min-w-0 placeholder:text-[#64748B]"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="text-[11px] font-medium text-[#475569] hover:text-[#0F172A] px-1.5 py-0.5 rounded-[6px] bg-white/70 shadow-2xs border border-white/80 shrink-0 cursor-pointer"
            >
              Esc
            </button>
          ) : (
            <div className="flex items-center gap-1 shrink-0 select-none pointer-events-none">
              <kbd className="text-[10px] font-mono font-medium text-[#475569] px-1.5 py-0.5 rounded-[5px] bg-[#CFDAE6]/70 border border-white/50">
                ⌘K
              </kbd>
            </div>
          )}
        </div>

        {/* Collapsible Accordion Task Groups Container (Scrollbars Hidden) */}
        <div
          data-ui="true"
          className="flex-1 overflow-y-auto pr-1 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          role="group"
          aria-label="Task Groups"
        >
          {/* Group 1: Overdue Section */}
          {overdueTasks.length > 0 && checklistFilter !== 'DONE' && (
            <div>
              <div className="flex items-center gap-2 py-1.5 px-1 mb-2">
                <button
                  type="button"
                  onClick={() => setIsOverdueOpen(!isOverdueOpen)}
                  className="flex items-center gap-2 text-[13px] font-normal text-[#475569] cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <IconChevronDown
                    size={14}
                    className={`text-[#475569] transition-transform ${isOverdueOpen ? '' : '-rotate-90'}`}
                  />
                  <span>Overdue</span>
                  <span className="bg-[#DCE4EE] text-[#1E293B] rounded-[6px] px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
                    {overdueTasks.length}
                  </span>
                </button>
              </div>

              {isOverdueOpen && (
                <div className="space-y-2">
                  {overdueTasks.map((task) => renderTaskRow(task, false))}
                </div>
              )}
            </div>
          )}

          {/* Group 2: Upcoming Section */}
          {upcomingTasks.length > 0 && checklistFilter !== 'DONE' && (
            <div>
              <div className="flex items-center gap-2 py-1.5 px-1 mb-2">
                <button
                  type="button"
                  onClick={() => setIsUpcomingOpen(!isUpcomingOpen)}
                  className="flex items-center gap-2 text-[13px] font-normal text-[#475569] cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <IconChevronDown
                    size={14}
                    className={`text-[#475569] transition-transform ${isUpcomingOpen ? '' : '-rotate-90'}`}
                  />
                  <span>Upcoming</span>
                  <span className="bg-[#DCE4EE] text-[#1E293B] rounded-[6px] px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
                    {upcomingTasks.length}
                  </span>
                </button>
              </div>

              {isUpcomingOpen && (
                <div className="space-y-2">
                  {upcomingTasks.map((task) => renderTaskRow(task, false))}
                </div>
              )}
            </div>
          )}

          {/* Group 3: Verified Section */}
          {verifiedTasks.length > 0 && checklistFilter !== 'PENDING' && (
            <div>
              <div className="flex items-center gap-2 py-1.5 px-1 mb-2">
                <button
                  type="button"
                  onClick={() => setIsVerifiedOpen(!isVerifiedOpen)}
                  className="flex items-center gap-2 text-[13px] font-normal text-[#475569] cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <IconChevronDown
                    size={14}
                    className={`text-[#475569] transition-transform ${isVerifiedOpen ? '' : '-rotate-90'}`}
                  />
                  <span>Verified</span>
                  <span className="bg-[#DCE4EE] text-[#1E293B] rounded-[6px] px-1.5 py-0.5 text-[11px] font-medium tabular-nums">
                    {verifiedTasks.length}
                  </span>
                </button>
              </div>

              {isVerifiedOpen && (
                <div className="space-y-2">
                  {verifiedTasks.map((task) => renderTaskRow(task, true))}
                </div>
              )}
            </div>
          )}

          {/* Empty state when filters yield no items */}
          {filteredTasks.length === 0 && (
            <div className="py-12 text-center text-[#475569]">
              <p className="text-sm font-medium">No tasks found matching your filter criteria.</p>
              <button
                type="button"
                onClick={() => {
                  setChecklistFilter('ALL');
                  setSelectedStaffFilter(null);
                  setSearchQuery('');
                  setIsOverdueOpen(true);
                  setIsUpcomingOpen(true);
                  setIsVerifiedOpen(true);
                }}
                className="mt-2 text-[13px] font-semibold text-[#0F172A] hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating White 3D Task Detail Card */}
      {focusedTask && (
        <aside
          aria-label="Task Detail"
          className="hidden xl:flex flex-col w-[270px] xl:w-[290px] shrink-0 mt-11 self-start bg-white rounded-[24px] p-5 border border-white shadow-[0_7px_22px_-4px_rgba(15,23,42,0.08),0_2px_6px_-1px_rgba(15,23,42,0.04),inset_0_1.5px_0_#FFFFFF] relative /* taste-skill-ignore */"
        >
          {/* Header: Squircle Time Chip & Status Badge */}
          <div className="flex items-center justify-between">
            <span className="bg-[#EEF2F6] rounded-[8px] px-2.5 py-1 text-xs font-medium text-[#0F172A] shadow-xs select-none">
              [ {focusedTask.time} ]
            </span>
            {focusedTask.done ? (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#E2E8F0] text-[#0F172A]">
                Verified
              </span>
            ) : focusedTask.time < '13:00' ? (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#0F172A] text-white">
                Overdue
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#EEF2F6] text-[#475569]">
                Upcoming
              </span>
            )}
          </div>

          {/* Title & Context */}
          <h2 className="text-[15px] font-medium text-[#0F172A] leading-snug mt-3 select-text">
            {focusedTask.title}
          </h2>
          <p className="text-[12px] text-[#64748B] mt-1.5 leading-relaxed">
            {getTaskGuideline(focusedTask.title)}
          </p>

          {/* Assignee Well: Punched-Down Recessed Well */}
          <div className="relative mt-4">
            <div className="bg-[#E3EAF2]/70 rounded-[12px] p-2.5 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06),0_1px_0_#FFF] flex items-center justify-between /* taste-skill-ignore */">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-[9px] bg-white text-[#0F172A] font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-white/80">
                  {focusedAssigneeStaff ? focusedAssigneeStaff.name.charAt(0) : focusedTask.assignee.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-[#0F172A] truncate">
                    {focusedAssigneeStaff ? focusedAssigneeStaff.name : focusedTask.assignee}
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate">
                    {focusedAssigneeStaff ? focusedAssigneeStaff.role : 'Station Duty'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReassigningTaskId(
                    reassigningTaskId === `detail-${focusedTask.id}` ? null : `detail-${focusedTask.id}`
                  );
                }}
                className="text-[11px] font-medium text-[#0F172A] hover:bg-white/80 px-2 py-1 rounded-[7px] bg-white/60 shadow-2xs border border-white/80 transition-colors shrink-0 cursor-pointer"
                aria-label={`Reassign ${focusedTask.title}`}
              >
                Reassign
              </button>
            </div>

            {/* Inline Reassignment Popover */}
            {reassigningTaskId === `detail-${focusedTask.id}` && (
              <div
                ref={reassignPopoverRef}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1.5 z-40 bg-[#F8FAFC] rounded-2xl p-1.5 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.08),0_2px_6px_-1px_rgba(15,23,42,0.04)] border border-white min-w-[170px] space-y-0.5 /* taste-skill-ignore */"
              >
                <div className="px-2 py-1 text-[11px] font-medium text-[#475569]">
                  On duty staff
                </div>
                {onDutyStaff.map((staff) => {
                  const parts = staff.name.split(' ');
                  const first = parts[0] || staff.name;
                  const isCurrent = focusedTask.assignee.startsWith(first);
                  return (
                    <button
                      key={staff.name}
                      type="button"
                      onClick={() => handleReassign(focusedTask.id, staff.name)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-[#E2E8F0] text-[#0F172A] font-semibold'
                          : 'text-[#334155] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">{staff.name}</span>
                        {staff.isLead && (
                          <span className="text-[11px] px-1 py-0.2 rounded bg-[#0F172A] text-white shrink-0">
                            Lead
                          </span>
                        )}
                      </div>
                      {isCurrent && <IconCheck size={12} className="text-[#0F172A] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action / Shortcut Footer */}
          <div className="border-t border-[#F1F5F9] pt-3 mt-4 flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <kbd className="text-[11px] font-mono font-medium text-[#475569] px-1.5 py-0.5 rounded-[5px] bg-[#EEF2F6] border border-white/60">
                Space
              </kbd>
              <span className="text-[11px] text-[#64748B]">to verify</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggleChecklist(focusedTask.id)}
              className={`px-3 py-1 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer shadow-xs border border-white/80 ${
                focusedTask.done
                  ? 'bg-[#EEF2F6] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                  : 'bg-[#0F172A] text-white hover:bg-[#1E293B]'
              }`}
              aria-label={`${focusedTask.done ? 'Reopen' : 'Verify'} routine ${focusedTask.title}`}
            >
              {focusedTask.done ? 'Reopen' : 'Verify'}
            </button>
          </div>
        </aside>
      )}
    </div>

        {/* Floating Bottom-Right Undo Toast Pill */}
        {undoState && (
          <div
            className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white text-xs px-3.5 py-2.5 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 /* taste-skill-ignore */"
            role="status"
            aria-live="polite"
          >
            <span>Routine {undoState.prevDone ? 'reopened' : 'verified'}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white font-medium text-[11px] cursor-pointer transition-colors"
              aria-label="Undo task completion"
            >
              Undo (⌘Z)
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

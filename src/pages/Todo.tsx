import React, { useEffect, useState, useRef } from 'react';
import { useTodoStore } from '../store/todoStore';
import { toast } from '../store/toastStore';
import { useActivityStore } from '../store/activityStore';
import type { Todo } from '../types';
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  X,
  Clock,
  ChevronRight,
  Columns,
  BrainCircuit,
  Loader2,
  CalendarDays
} from 'lucide-react';
import { cn } from '../utils/cn';
import { getLocalDateISO } from '../utils/date';

// FullCalendar core and plugins
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';

interface AITodoSuggestion {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  todo_time?: string;
  subtasks?: string[];
}

export const TodoPage: React.FC = () => {
  const { todos, fetchTodos, addTodo, updateTodo, deleteTodo, loading } = useTodoStore();

  // Tab View state
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'kanban'>('calendar');

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(getLocalDateISO());
  const [formTime, setFormTime] = useState('');
  const [formStatus, setFormStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  // AI Smart Generator States
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [aiGoal, setAiGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AITodoSuggestion[]>([]);

  // Drag and Drop States
  const [draggedTodo, setDraggedTodo] = useState<Todo | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const calendarRef = useRef<FullCalendar>(null);

  // Fetch tasks on load
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Listen to global palette/shortcut custom events
  useEffect(() => {
    const handleOpenTodo = (e: Event) => {
      const todoId = (e as CustomEvent<string>).detail;
      const found = todos.find(t => t.id === todoId);
      if (found) {
        handleOpenEditModal(found);
      }
    };
    
    const handleOpenNew = () => {
      handleOpenAddModal();
    };

    window.addEventListener('open-palette-todo', handleOpenTodo);
    window.addEventListener('open-new-todo-modal', handleOpenNew);
    
    return () => {
      window.removeEventListener('open-palette-todo', handleOpenTodo);
      window.removeEventListener('open-new-todo-modal', handleOpenNew);
    };
  }, [todos]);

  // Map stores into FullCalendar Event formats
  const getCalendarEvents = () => {
    const filtered = todos.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.map(t => {
      let bgColor = '#6366f1'; // default Indigo
      if (t.status === 'completed') bgColor = '#10b981'; // Emerald
      if (t.status === 'in_progress') bgColor = '#3b82f6'; // Blue

      return {
        id: t.id,
        title: t.title,
        start: t.todo_time ? `${t.todo_date}T${t.todo_time}` : t.todo_date,
        allDay: !t.todo_time,
        backgroundColor: bgColor,
        borderColor: 'transparent',
        textColor: '#ffffff',
        extendedProps: { ...t },
      };
    });
  };

  // Open Modal for Add
  function handleOpenAddModal(dateStr?: string) {
    setEditingTodo(null);
    setFormTitle('');
    setFormDescription('');
    setFormDate(dateStr || getLocalDateISO());
    setFormTime('');
    setFormStatus('pending');
    setIsModalOpen(true);
  }

  // Open Modal for Edit
  function handleOpenEditModal(todo: Todo) {
    setEditingTodo(todo);
    setFormTitle(todo.title);
    setFormDescription(todo.description || '');
    setFormDate(todo.todo_date);
    setFormTime(todo.todo_time || '');
    setFormStatus(todo.status);
    setIsModalOpen(true);
  }

  // Save / Update Form Submission
  const handleSaveTodoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      if (editingTodo) {
        await updateTodo(editingTodo.id, {
          title: formTitle,
          description: formDescription,
          todo_date: formDate,
          todo_time: formTime || undefined,
          status: formStatus,
        });
        toast.success('Task updated successfully');
        useActivityStore.getState().addLog('todo', `Updated task: "${formTitle}"`);
      } else {
        await addTodo({
          title: formTitle,
          description: formDescription,
          todo_date: formDate,
          todo_time: formTime || undefined,
          status: formStatus,
        });
        toast.success('Task created successfully');
        useActivityStore.getState().addLog('todo', `Created task: "${formTitle}"`);
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Failed to save task');
    }
  };

  // Delete Operation
  const handleDeleteTodoClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const titleToLog = todos.find(t => t.id === id)?.title || editingTodo?.title || 'Untitled task';
        await deleteTodo(id);
        toast.success('Task deleted successfully');
        useActivityStore.getState().addLog('todo', `Deleted task: "${titleToLog}"`);
        setIsModalOpen(false);
      } catch {
        toast.error('Failed to delete task');
      }
    }
  };

  // Toggle quick check status
  const handleToggleStatus = async (todo: Todo, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = todo.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateTodo(todo.id, { status: nextStatus });
      toast.success(nextStatus === 'completed' ? 'Task marked as completed' : 'Task marked as pending');
      useActivityStore.getState().addLog('todo', nextStatus === 'completed' ? `Completed task: "${todo.title}"` : `Marked task as pending: "${todo.title}"`);
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  // Drag & Drop Board Event Handlers
  const handleDragStart = (e: React.DragEvent, todo: Todo) => {
    setDraggedTodo(todo);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', todo.id);
  };

  const handleDragEnd = () => {
    setDraggedTodo(null);
    setActiveColumn(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (activeColumn !== status) {
      setActiveColumn(status);
    }
  };

  const handleDropColumn = async (e: React.DragEvent, nextStatus: 'pending' | 'in_progress' | 'completed') => {
    e.preventDefault();
    const todoId = e.dataTransfer.getData('text/plain') || draggedTodo?.id;
    if (!todoId) return;

    const todoToMove = todos.find(t => t.id === todoId);
    if (todoToMove && todoToMove.status !== nextStatus) {
      try {
        await updateTodo(todoId, { status: nextStatus });
        toast.success(`Task status updated to ${nextStatus.replace('_', ' ')}`);
        useActivityStore.getState().addLog('todo', `Moved task to ${nextStatus.replace('_', ' ')}: "${todoToMove.title}"`);
      } catch {
        toast.error('Failed to drop task');
      }
    }
    setDraggedTodo(null);
    setActiveColumn(null);
  };

  // AI Smart Todo Suggestion Generator
  const handleGenerateAITodos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiGoal.trim()) {
      toast.error('Please enter a goal or task topic');
      return;
    }

    setIsGenerating(true);
    try {
      // Realistic simulation for AI breakdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const promptGoal = aiGoal.toLowerCase();
      let suggestions: AITodoSuggestion[] = [];

      if (promptGoal.includes('angular') || promptGoal.includes('interview')) {
        suggestions = [
          { title: '📚 Revise Angular Core Directives', description: 'Review structural directives (*ngIf, *ngFor), Custom directive creation, and ElementRef interfaces.', priority: 'high', subtasks: ['Directives Lifecycle', 'ViewContainerRef'] },
          { title: '🔄 Deep Dive into RxJS Streams', description: 'Study switchMap, mergeMap, catchError pipelines, and BehaviorSubjects implementations.', priority: 'high', subtasks: ['Subject vs BehaviorSubject', 'Stream Unsubscriptions'] },
          { title: '⚡ Practice Signals API Concepts', description: 'Build sample widgets using WritableSignals, computed arrays, and signal effects.', priority: 'medium', subtasks: ['signals vs RxJS', 'computed signals'] },
          { title: '🛠️ Run Angular Mock Interview quiz', description: 'Walk through top questions on Angular Router, Dependency Injection, and Lazy Loading.', priority: 'low' },
        ];
      } else if (promptGoal.includes('kedarnath') || promptGoal.includes('trip') || promptGoal.includes('travel')) {
        suggestions = [
          { title: '🎟️ Complete Kedarnath Biometric registration', description: 'Register online via GMVN portals and secure verification documents.', priority: 'high' },
          { title: '🥾 Procure high-altitude clothing & thermal gear', description: 'Pack heavy waterproof jackets, hiking boots, trekking poles, and thermals.', priority: 'high', subtasks: ['Waterproof socks', 'Trekking shoes'] },
          { title: '🏨 Pre-book cottages in Guptkashi or Sonprayag', description: 'Ensure reliable lodging stops before initiating the 16km pedestrian trek.', priority: 'medium' },
          { title: '💊 Pack safety medical kit and oxygen canister', description: 'Store altitude pills, band-aids, painkillers, and mini portable canisters.', priority: 'medium' },
        ];
      } else {
        // Fallback default dynamic breakdown
        suggestions = [
          { title: `🎯 Define key objectives for: ${aiGoal}`, description: 'Outline high-level goals, targets, and milestones.', priority: 'high', subtasks: ['Brainstorming metrics', 'Identify roadblocks'] },
          { title: '⚙️ Assemble resources & setup tools', description: 'Gather reference notes, code libraries, templates, and required environments.', priority: 'medium' },
          { title: '✅ Build initial proof-of-concept draft', description: 'Prepare early models, mock-ups, or outlines, and gather initial opinions.', priority: 'medium' },
          { title: '📢 Deliver final presentations / updates', description: 'Review results against original checklist and log actions.', priority: 'low' },
        ];
      }

      setAiSuggestions(suggestions);
      toast.success('Successfully generated structured schedule!');
      useActivityStore.getState().addLog('ai', `Generated smart Todo schedule for goal: "${aiGoal}"`);
    } catch {
      toast.error('AI generator encountered an issue');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated AI checklist to list
  const handleSaveAISuggestions = async () => {
    if (aiSuggestions.length === 0) return;
    try {
      const goalToLog = aiGoal || 'smart task list';
      for (const item of aiSuggestions) {
        await addTodo({
          title: item.title,
          description: `${item.description} ${item.subtasks ? '\nSubtasks: ' + item.subtasks.join(', ') : ''}`,
          todo_date: getLocalDateISO(),
          status: 'pending'
        });
      }
      toast.success(`Successfully saved ${aiSuggestions.length} tasks to schedule!`);
      useActivityStore.getState().addLog('todo', `Imported ${aiSuggestions.length} AI suggestions for: "${goalToLog}"`);
      setAiSuggestions([]);
      setAiGoal('');
      setIsAIPanelOpen(false);
    } catch {
      toast.error('Failed to import suggestions');
    }
  };

  // Delete individual suggestion from preview list
  const handleDeleteSuggestion = (idx: number) => {
    setAiSuggestions(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle clicking calendar cells to add todo
  const handleCalendarDateClick = (arg: DateClickArg) => {
    handleOpenAddModal(arg.dateStr);
  };

  // Handle clicking events in calendar to edit
  const handleCalendarEventClick = (arg: EventClickArg) => {
    const todoData = arg.event.extendedProps as Todo;
    handleOpenEditModal(todoData);
  };

  // Filter list for List View
  const getFilteredListTodos = () => {
    const list = todos.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return list.sort((a, b) => {
      if (a.todo_date !== b.todo_date) {
        return a.todo_date.localeCompare(b.todo_date);
      }
      return (a.todo_time || '').localeCompare(b.todo_time || '');
    });
  };

  const listTodos = getFilteredListTodos();

  // Grouping list todos by human dates
  const groupTodosByDate = (todosList: Todo[]) => {
    const groups: { [key: string]: Todo[] } = {};
    todosList.forEach(t => {
      const dateVal = t.todo_date;
      if (!groups[dateVal]) groups[dateVal] = [];
      groups[dateVal].push(t);
    });
    return groups;
  };

  const groupedTodos = groupTodosByDate(listTodos);

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative min-h-[calc(100vh-8rem)] select-none">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Toggle Mode Pills */}
        <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 p-1 rounded-2xl shadow-inner shrink-0 relative">
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              viewMode === 'calendar'
                ? "bg-white dark:bg-slate-800 text-brand-500 dark:text-brand-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              viewMode === 'list'
                ? "bg-white dark:bg-slate-800 text-brand-500 dark:text-brand-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span>Agenda</span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              viewMode === 'kanban'
                ? "bg-white dark:bg-slate-800 text-brand-500 dark:text-brand-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Kanban Board</span>
          </button>
        </div>

        {/* Filters & AI Button */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* AI Generator button */}
          <button
            onClick={() => setIsAIPanelOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.02]"
          >
            <BrainCircuit className="h-4 w-4" />
            <span>AI Todo Generator</span>
          </button>

          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm md:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              data-global-search="true"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-800 dark:text-white"
            />
          </div>

          {/* Status selector */}
          {viewMode !== 'kanban' && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 p-1 rounded-xl shadow-sm">
              <Filter className="h-3.5 w-3.5 text-slate-400 ml-2" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as 'all' | 'pending' | 'in_progress' | 'completed')}
                className="py-1 pl-1 pr-6 text-xs bg-transparent text-slate-600 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer border-0"
              >
                <option value="all">All States</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. Visual Content Box */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden bg-white dark:bg-slate-900/40 shadow-premium flex-1 flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 flex-1">
            <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
            <span className="text-sm font-semibold text-slate-400 mt-4 animate-pulse">Loading agenda details...</span>
          </div>
        ) : viewMode === 'calendar' ? (
          /* CALENDAR VIEW */
          <div className="overflow-x-auto">
            <div className="min-w-[600px] md:min-w-0">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={getCalendarEvents()}
                dateClick={handleCalendarDateClick}
                eventClick={handleCalendarEventClick}
                editable={false}
                selectable={true}
                height="auto"
                aspectRatio={1.4}
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  meridiem: 'short',
                }}
              />
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* AGENDA LIST VIEW */
          <div className="flex flex-col gap-6 flex-1">
            {listTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center select-none animate-fade-in flex-1">
                <List className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3 animate-bounce-subtle" />
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">No scheduled tasks</h3>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                  Create a task using the floating add button or change search options to index scheduled events.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-1">
                {Object.keys(groupedTodos).map(dateStr => {
                  const dateObj = new Date(dateStr + 'T00:00:00');
                  const isToday = dateStr === getLocalDateISO();
                  
                  return (
                    <div key={dateStr} className="flex flex-col gap-3 animate-fade-in">
                      {/* Date header */}
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border",
                          isToday
                            ? "bg-brand-50/50 dark:bg-brand-950/20 border-brand-200/40 dark:border-brand-900/10 text-brand-600 dark:text-brand-400"
                            : "bg-slate-50 dark:bg-slate-900/30 border-slate-200/30 dark:border-slate-800/10 text-slate-500 dark:text-slate-400"
                        )}>
                          {isToday ? 'Today' : dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="h-px bg-slate-200/50 dark:bg-slate-800/20 flex-1" />
                      </div>

                      {/* Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {groupedTodos[dateStr].map(todo => {
                          const isCompleted = todo.status === 'completed';
                          const isInProgress = todo.status === 'in_progress';
                          
                          return (
                            <div
                              key={todo.id}
                              onClick={() => handleOpenEditModal(todo)}
                              className={cn(
                                "flex flex-col justify-between p-4 rounded-2xl border transition-all glass-panel-hover cursor-pointer relative group",
                                isCompleted
                                  ? "bg-slate-50/40 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900/60 opacity-65"
                                  : "bg-white dark:bg-slate-900/30 border-slate-200/40 dark:border-slate-800/20 shadow-sm"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex gap-3 overflow-hidden">
                                  {/* Toggle */}
                                  <button
                                    onClick={e => handleToggleStatus(todo, e)}
                                    className="text-slate-400 hover:text-brand-500 transition-colors mt-0.5 shrink-0 cursor-pointer"
                                    title="Toggle Completion"
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2 className="h-5 w-5 text-brand-500" />
                                    ) : (
                                      <Circle className="h-5 w-5" />
                                    )}
                                  </button>
                                  <div className="flex flex-col overflow-hidden">
                                    <span className={cn(
                                      "text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-6",
                                      isCompleted ? "line-through text-slate-400 dark:text-slate-600" : ""
                                    )}>
                                      {todo.title}
                                    </span>
                                    {todo.description && (
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                        {todo.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Footer */}
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/50 dark:border-slate-800/10">
                                <div className="flex items-center gap-3">
                                  {todo.todo_time && (
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                                      <Clock className="h-3 w-3 text-brand-500" />
                                      <span>{todo.todo_time}</span>
                                    </span>
                                  )}
                                  <span className={cn(
                                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider border",
                                    isCompleted && "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/30 dark:border-emerald-900/10 text-emerald-600 dark:text-emerald-400",
                                    isInProgress && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/30 dark:border-blue-900/10 text-blue-600 dark:text-blue-400",
                                    todo.status === 'pending' && "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/30 dark:border-amber-900/10 text-amber-600 dark:text-amber-400"
                                  )}>
                                    {todo.status}
                                  </span>
                                </div>

                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteTodoClick(todo.id);
                                  }}
                                  className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0 animate-fade-in"
                                  title="Delete task"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* KANBAN BOARD VIEW */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-[550px] items-stretch animate-fade-in">
            {/* Columns definitions */}
            {(['pending', 'in_progress', 'completed'] as const).map((columnStatus) => {
              const columnTodos = todos.filter(t => t.status === columnStatus && (
                t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                t.description.toLowerCase().includes(searchQuery.toLowerCase())
              ));
              
              const isOver = activeColumn === columnStatus;

              let colHeaderName = 'Pending';
              let headerColor = 'text-amber-500 border-amber-500/20 bg-amber-500/5';
              if (columnStatus === 'in_progress') {
                colHeaderName = 'In Progress';
                headerColor = 'text-blue-500 border-blue-500/20 bg-blue-500/5';
              } else if (columnStatus === 'completed') {
                colHeaderName = 'Completed';
                headerColor = 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
              }

              return (
                <div
                  key={columnStatus}
                  onDragOver={(e) => handleDragOverColumn(e, columnStatus)}
                  onDragLeave={() => setActiveColumn(null)}
                  onDrop={(e) => handleDropColumn(e, columnStatus)}
                  className={cn(
                    "flex flex-col gap-4 rounded-3xl p-4 border transition-all duration-200 flex-1 min-h-[500px]",
                    isOver 
                      ? "bg-brand-500/[0.04] border-dashed border-2 border-brand-500/50 shadow-inner" 
                      : "bg-slate-50/40 dark:bg-slate-950/20 border-slate-200/40 dark:border-slate-800/10"
                  )}
                >
                  {/* Column Sticky Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 select-none">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 border rounded-lg tracking-wider shrink-0", headerColor)}>
                        {colHeaderName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        {columnTodos.length}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setEditingTodo(null);
                        setFormTitle('');
                        setFormDescription('');
                        setFormDate(getLocalDateISO());
                        setFormStatus(columnStatus);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                      title={`Add to ${colHeaderName}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Cards container */}
                  <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-0.5 scrollbar-thin">
                    {columnTodos.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-40 select-none">
                        <Columns className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2 stroke-dasharray" />
                        <span className="text-[9px] font-bold text-slate-400">Empty column</span>
                      </div>
                    ) : (
                      columnTodos.map((todo) => {
                        const isDragging = draggedTodo?.id === todo.id;
                        return (
                          <div
                            key={todo.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, todo)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleOpenEditModal(todo)}
                            className={cn(
                              "flex flex-col gap-3 p-4 rounded-2xl border bg-white dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/20 shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing hover:scale-[1.01] hover:shadow-premium relative group",
                              isDragging ? "opacity-30 border-brand-500/40 scale-95 shadow-none" : ""
                            )}
                          >
                            {/* Card Content */}
                            <div className="flex items-start gap-2.5">
                              <button
                                onClick={(e) => handleToggleStatus(todo, e)}
                                className="text-slate-400 hover:text-brand-500 transition-colors mt-0.5 shrink-0"
                              >
                                {todo.status === 'completed' ? (
                                  <CheckCircle2 className="h-4.5 w-4.5 text-brand-500" />
                                ) : (
                                  <Circle className="h-4.5 w-4.5" />
                                )}
                              </button>
                              
                              <div className="flex flex-col min-w-0">
                                <span className={cn(
                                  "text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-4 leading-normal",
                                  todo.status === 'completed' ? "line-through text-slate-400 dark:text-slate-600" : ""
                                )}>
                                  {todo.title}
                                </span>
                                {todo.description && (
                                  <p className="text-[9px] text-slate-400 dark:text-slate-500 line-clamp-2 mt-1 leading-normal">
                                    {todo.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Card Footer */}
                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100/50 dark:border-slate-800/10">
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                  <CalendarDays className="h-2.5 w-2.5 text-brand-500" />
                                  <span>{new Date(todo.todo_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </span>
                                {todo.todo_time && (
                                  <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 px-1 py-0.5 border border-slate-200/20 dark:border-slate-800/30 rounded">
                                    <Clock className="h-2.5 w-2.5 text-indigo-500" />
                                    <span>{todo.todo_time}</span>
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteTodoClick(todo.id);
                                }}
                                className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Floating Add Button */}
      <button
        onClick={() => handleOpenAddModal()}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-750 text-white shadow-lg hover:shadow-premium shadow-brand-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Add task"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* 4. CRUD Form Dialog Modal - Clean layout contrast updates */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm">
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl animate-slide-up"
          >
            {/* Modal Header */}
            <div className="flex h-14 items-center justify-between border-b border-slate-100 dark:border-slate-800/40 px-6 bg-slate-50/50 dark:bg-slate-950/20">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {editingTodo ? 'Edit Scheduled Task' : 'Schedule New Task'}
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTodoSubmit} className="p-6 flex flex-col gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design review session"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-400 transition-all text-slate-800 dark:text-white"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline objectives, coordinates, links..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-400 transition-all resize-none text-slate-800 dark:text-white"
                />
              </div>

              {/* Date & Time Picker Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    Schedule Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-400 transition-all text-slate-800 dark:text-white cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500">
                    Slot Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-400 transition-all text-slate-800 dark:text-white cursor-pointer"
                  />
                </div>
              </div>

              {/* Status Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'pending' | 'in_progress' | 'completed')}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-400 transition-all text-slate-800 dark:text-white cursor-pointer appearance-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 rotate-90 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/25">
                {editingTodo ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteTodoClick(editingTodo.id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Task</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {editingTodo ? 'Save Changes' : 'Schedule Task'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. AI Smart Todo Generator Overlay Panel - Side Slide Drawer */}
      {isAIPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end animate-fade-in bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm">
          {/* Overlay dismissal */}
          <div className="absolute inset-0" onClick={() => setIsAIPanelOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-fade-in">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800/40 px-6 bg-slate-50/30 dark:bg-slate-950/10">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-brand-500 animate-pulse-subtle" />
                <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  AI Smart Todo Generator
                </span>
              </div>
              <button
                onClick={() => setIsAIPanelOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* AI Prompter */}
            <div className="p-6 flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800/40 shrink-0">
              <form onSubmit={handleGenerateAITodos} className="flex flex-col gap-2.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500">
                  Enter your current project goal or objective
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prepare for Angular interview"
                    value={aiGoal}
                    onChange={e => setAiGoal(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-400 transition-all text-slate-800 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-tr from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center shrink-0 min-w-[90px]"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <span>Break Down</span>
                    )}
                  </button>
                </div>
                <div className="flex gap-2 text-[9px] text-slate-400 mt-1 select-none font-bold">
                  <span>Try:</span>
                  <button type="button" onClick={() => setAiGoal('Prepare for Angular interview')} className="hover:text-brand-500 underline">Angular interview</button>
                  <span>•</span>
                  <button type="button" onClick={() => setAiGoal('Plan Kedarnath trip')} className="hover:text-brand-500 underline">Kedarnath Trip</button>
                  <span>•</span>
                  <button type="button" onClick={() => setAiGoal('Prepare sprint demo')} className="hover:text-brand-500 underline">Sprint demo</button>
                </div>
              </form>
            </div>

            {/* Breakdown Sugggestions results rendering */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20 animate-pulse">
                  <div className="relative flex items-center justify-center mb-4">
                    <div className="absolute h-12 w-12 rounded-full bg-brand-500/10 animate-ping" />
                    <BrainCircuit className="h-8 w-8 text-brand-500" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Analyzing objective sequences...
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal max-w-xs">
                    Our local simulated AI is arranging tasks, subtasks list, and priorities schedules.
                  </p>
                </div>
              ) : aiSuggestions.length > 0 ? (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40 select-none">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 leading-normal">
                        Suggested breakdown
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        {aiSuggestions.length} actions recommended
                      </span>
                    </div>

                    <button
                      onClick={handleSaveAISuggestions}
                      className="px-3.5 py-1.5 text-[10px] font-black uppercase text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-all cursor-pointer tracking-wider"
                    >
                      Import All Suggestions
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {aiSuggestions.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/30 bg-slate-50/30 dark:bg-slate-900/20 relative group"
                      >
                        <button
                          onClick={() => handleDeleteSuggestion(idx)}
                          className="absolute right-3 top-3 p-1 rounded-lg text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        
                        <div className="flex flex-col min-w-0 pr-4">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border tracking-wider",
                              item.priority === 'high' && "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/20 text-rose-500",
                              item.priority === 'medium' && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/20 text-blue-500",
                              item.priority === 'low' && "bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/20 text-slate-400"
                            )}>
                              {item.priority} Priority
                            </span>
                          </div>
                          
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1.5 leading-normal">
                            {item.title}
                          </span>
                          
                          <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 leading-normal">
                            {item.description}
                          </p>

                          {item.subtasks && (
                            <div className="flex flex-col gap-1.5 mt-3 pt-2.5 border-t border-slate-100/50 dark:border-slate-800/20">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                                Checklist
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {item.subtasks.map((sub, sIdx) => (
                                  <span key={sIdx} className="text-[9px] font-bold text-slate-500 dark:text-slate-450 bg-white dark:bg-slate-800 px-2 py-0.5 border border-slate-250/20 dark:border-slate-700/40 rounded-lg">
                                    • {sub}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 select-none py-16">
                  <BrainCircuit className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3 stroke-dasharray" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    No suggestions formulated
                  </span>
                  <p className="text-[9px] text-slate-400 mt-1 max-w-xs leading-normal">
                    Enter a specific workspace goal above and press "Break Down" to generate dynamic checklists immediately.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

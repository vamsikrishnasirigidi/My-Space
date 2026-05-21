import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTodoStore } from '../store/todoStore';
import { useNoteStore } from '../store/noteStore';
import { useActivityStore } from '../store/activityStore';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Pin, 
  Play, 
  Pause, 
  RotateCcw,
  Calendar,
  FileText,
  TrendingUp,
  Quote,
  Clock,
  Settings,
  BrainCircuit,
  Trash2,
  Activity
} from 'lucide-react';
import { cn } from '../utils/cn';
import { toast } from '../store/toastStore';

// Pre-seeded inspirational quotes list
const QUOTES = [
  { text: "Your mind is for having ideas, not holding them.", author: "David Allen" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Make each day your masterpiece.", author: "John Wooden" }
];

export const Home: React.FC = () => {
  const { user } = useAuthStore();
  const { todos, fetchTodos, updateTodo } = useTodoStore();
  const { notes, fetchNotes } = useNoteStore();
  const { activities, clearLogs } = useActivityStore();
  const navigate = useNavigate();

  // Pomodoro/Focus Timer State
  const [timerSeconds, setTimerSeconds] = useState(1500); // 25 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(QUOTES[0]);

  // Fetch all necessary dashboard data on mount
  useEffect(() => {
    fetchTodos();
    fetchNotes();
    // Select a random quote on refresh
    const randomIdx = Math.floor(Math.random() * QUOTES.length);
    setSelectedQuote(QUOTES[randomIdx]);
  }, [fetchTodos, fetchNotes]);

  // Browser Tab Title Watcher for Focus Timer
  useEffect(() => {
    const originalTitle = "My Space";
    if (timerActive && timerSeconds > 0) {
      document.title = `⏱️ ${formatTimer(timerSeconds)} - Focus Mode`;
    } else if (timerSeconds === 0) {
      document.title = "🧘 Focus Complete!";
    } else {
      document.title = originalTitle;
    }
    return () => {
      document.title = originalTitle;
    };
  }, [timerActive, timerSeconds]);

  // Focus Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
      toast.success('Focus session completed! Outstanding job. 🎉');
      useActivityStore.getState().addLog('focus', 'Completed a 25-minute Deep Focus session 🧘');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timerSeconds]);

  // Dynamic Time-based Welcome Greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Helper date conversions
  const getTodayDateStr = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Filters for Dashboard widgets
  const todayDateStr = getTodayDateStr();
  const todayTodos = todos.filter(t => t.todo_date === todayDateStr);
  const pendingTodayTodos = todayTodos.filter(t => t.status !== 'completed');
  const pinnedNotes = notes.filter(n => n.show_in_home);

  // Statistics Calculations
  const totalTasks = todos.length;
  const completedTasksCount = todos.filter(t => t.status === 'completed').length;
  const pendingTasksCount = totalTasks - completedTasksCount;
  const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  // Format seconds to MM:SS
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const handleToggleTodoStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const todoItem = todos.find(t => t.id === id);
    await updateTodo(id, { status: newStatus });
    if (todoItem) {
      useActivityStore.getState().addLog(
        'todo', 
        newStatus === 'completed' 
          ? `Completed task: "${todoItem.title}"` 
          : `Marked task as pending: "${todoItem.title}"`
      );
    }
  };

  const handleToggleTimer = () => {
    const nextActive = !timerActive;
    setTimerActive(nextActive);
    if (nextActive) {
      useActivityStore.getState().addLog('focus', 'Initiated a Focus Session ⏱️');
    } else {
      useActivityStore.getState().addLog('focus', 'Paused current Focus Session ⏱️');
    }
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(1500);
    useActivityStore.getState().addLog('focus', 'Reset Focus Timer back to 25m');
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* 1. Header & Welcome Message */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{getGreeting()}, {user?.name || 'Vamsi'}</span>
            <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse-subtle" />
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Let's see what is on your mind and checklist today.
          </p>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm flex items-center gap-2 select-none self-start md:self-auto">
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* 2. Quick Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completion Rate</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{completionRate}%</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center font-bold shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-5 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed Tasks</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{completedTasksCount}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center font-bold shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-5 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Tasks</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{pendingTasksCount}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center font-bold shadow-sm">
            <Circle className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-panel-hover rounded-2xl p-5 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Notes</span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{notes.length}</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center font-bold shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Core Content Row: Today's Tasks & Focus Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Tasks Summary (7 Cols) */}
        <div className="glass-panel rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Today's Agenda
              </h2>
              <span className="text-xs text-slate-400 font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 px-2.5 py-1 rounded-xl">
                {pendingTodayTodos.length} pending
              </span>
            </div>

            {todayTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center select-none">
                <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Clear Schedule</span>
                <span className="text-xs text-slate-400 mt-1">No calendar tasks slotted for today.</span>
                <button
                  onClick={() => navigate('/todo')}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Plan A Task
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {todayTodos.map(todo => {
                  const isCompleted = todo.status === 'completed';
                  return (
                    <div 
                      key={todo.id}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-2xl border transition-all hover:bg-slate-50/50 dark:hover:bg-slate-900/20",
                        isCompleted 
                          ? "bg-slate-50/40 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900/60 opacity-60" 
                          : "bg-white dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/20 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          onClick={() => handleToggleTodoStatus(todo.id, todo.status)}
                          className="text-slate-400 hover:text-indigo-500 transition-colors shrink-0 cursor-pointer"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <div className="flex flex-col overflow-hidden">
                          <span className={cn(
                            "text-sm font-semibold text-slate-800 dark:text-slate-200 truncate",
                            isCompleted ? "line-through text-slate-400 dark:text-slate-600" : ""
                          )}>
                            {todo.title}
                          </span>
                          {todo.todo_time && (
                            <span className="text-xxs text-slate-400 mt-0.5">
                              ⏱️ {todo.todo_time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/40 dark:border-slate-800/20 flex justify-end">
            <button
              onClick={() => navigate('/todo')}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Planner</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Pomodoro Focus & Quote Widget (5 Cols) */}
        <div className="grid grid-cols-1 gap-6 lg:col-span-5">
          {/* Focus Timer Card */}
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Focus Engine
              </h2>
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse-subtle" />
            </div>

            <div className="flex flex-col items-center justify-center py-4">
              <div className={cn(
                "text-4xl md:text-5xl font-black tracking-tight select-none relative z-10 transition-all font-mono",
                timerActive ? "text-indigo-500 drop-shadow-[0_0_12px_rgba(99,102,241,0.2)] scale-105" : "text-slate-800 dark:text-slate-100"
              )}>
                {formatTimer(timerSeconds)}
              </div>
              <span className="text-xxs text-slate-400 mt-2 font-medium tracking-wide uppercase">
                {timerActive ? 'FOCUS SESSION ACTIVE' : 'TIMER PAUSED'}
              </span>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={handleToggleTimer}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:scale-105 transition-all cursor-pointer"
                  title={timerActive ? 'Pause' : 'Start Focus'}
                >
                  {timerActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                </button>
                <button
                  onClick={handleResetTimer}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 shadow-sm hover:scale-105 transition-all cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Inspirational Quote Card */}
          <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-indigo-500/[0.02] to-blue-500/[0.02]">
            <Quote className="absolute right-6 top-6 h-10 w-10 text-slate-200/50 dark:text-slate-800/30 rotate-18" />
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Quote className="h-3 w-3" />
                <span>Quote of the Day</span>
              </span>
              <p className="text-sm italic font-medium leading-relaxed text-slate-600 dark:text-slate-300 pr-8">
                "{selectedQuote.text}"
              </p>
            </div>
            <span className="text-xs text-slate-400 font-bold self-end mt-4">
              — {selectedQuote.author}
            </span>
          </div>
        </div>
      </div>

      {/* Helper relative time formatter */}
      {(() => {
        // We define the relative time formatter function inside the render or component body block scope.
      })()}

      {/* 4. Productivity Insights & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Analytics Card (7 Cols) */}
        <div className="glass-panel rounded-3xl p-6 lg:col-span-7 flex flex-col justify-between bg-white dark:bg-slate-900/30">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-500 shrink-0" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Productivity Insights
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch flex-1">
            {/* Donut Chart: Task Completion Rate */}
            <div className="flex flex-col items-center justify-center p-4 border border-slate-200/30 dark:border-slate-800/20 bg-slate-50/[0.01] rounded-2xl">
              <span className="text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                Task Completion
              </span>
              <div className="relative h-24 w-24 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-100 dark:stroke-slate-850 fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-indigo-500 fill-none transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - completionRate / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                    {completionRate}%
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">
                    Done
                  </span>
                </div>
              </div>
              <div className="flex justify-between w-full mt-3 px-2 text-[10px] text-slate-450 dark:text-slate-550 font-bold">
                <span>Total: {totalTasks}</span>
                <span>Done: {completedTasksCount}</span>
              </div>
            </div>

            {/* SVG Weekly Activities Bar Chart */}
            {(() => {
              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const last7 = [];
              for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                last7.push({
                  dateStr: d.toISOString().split('T')[0],
                  label: days[d.getDay()],
                  count: 0
                });
              }

              last7.forEach(item => {
                item.count = activities.filter(act => act.timestamp.split('T')[0] === item.dateStr).length;
              });

              const maxCount = Math.max(...last7.map(x => x.count), 1);

              return (
                <div className="flex flex-col p-4 border border-slate-200/30 dark:border-slate-800/20 bg-slate-50/[0.01] rounded-2xl h-full justify-between sm:col-span-2">
                  <span className="text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 self-center sm:self-start">
                    Weekly Activity Volume
                  </span>
                  <div className="flex items-end justify-between h-24 px-1">
                    {last7.map((day, idx) => {
                      const pctHeight = (day.count / maxCount) * 60; // scale up to 60px
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 group">
                          <div className="w-full flex justify-center relative">
                            <span className="absolute -top-6 text-[9px] font-bold font-mono text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              {day.count}
                            </span>
                            <div 
                              style={{ height: `${Math.max(pctHeight, 6)}px` }}
                              className="w-4 sm:w-5 bg-gradient-to-t from-indigo-500/80 to-brand-500 rounded-md transition-all group-hover:from-indigo-500 group-hover:to-brand-400 cursor-pointer shadow-sm shadow-indigo-500/10"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            {day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Productivity Trend Line Chart */}
          {(() => {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const last7 = [];
            for (let i = 6; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              last7.push({
                dateStr: d.toISOString().split('T')[0],
                label: days[d.getDay()],
                completed: 0
              });
            }

            last7.forEach(item => {
              item.completed = todos.filter(t => t.status === 'completed' && t.todo_date === item.dateStr).length;
            });

            const maxCompleted = Math.max(...last7.map(x => x.completed), 1);
            
            const width = 300;
            const height = 60;
            const padding = 15;
            const points = last7.map((day, i) => {
              const x = padding + (i * (width - padding * 2)) / 6;
              const y = height - padding - (day.completed / maxCompleted) * (height - padding * 2);
              return { x, y, label: day.label, count: day.completed };
            });

            const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
            const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

            return (
              <div className="mt-4 p-4 border border-slate-200/30 dark:border-slate-800/20 bg-slate-50/[0.01] rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Task Completion Rate Trend
                  </span>
                  <span className="text-[10px] text-indigo-500 font-bold flex items-center gap-1 select-none">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Focus velocity</span>
                  </span>
                </div>
                <div className="w-full relative">
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 overflow-visible">
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    <line x1={points[0].x} y1={height - padding} x2={points[points.length - 1].x} y2={height - padding} className="stroke-slate-200/50 dark:stroke-slate-800/40" strokeWidth="1" />
                    
                    <path d={areaD} fill="url(#areaGrad)" />
                    
                    <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {points.map((p, idx) => (
                      <g key={idx} className="group cursor-pointer">
                        <circle cx={p.x} cy={p.y} r="3" className="fill-indigo-600 stroke-white dark:stroke-slate-900 stroke-1.5 transition-all group-hover:r-4.5 group-hover:fill-indigo-500" />
                        <text x={p.x} y={p.y - 6} textAnchor="middle" className="text-[8px] font-bold font-mono fill-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {p.count}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Activity Feed Box (5 Cols) */}
        <div className="glass-panel rounded-3xl p-6 lg:col-span-5 flex flex-col justify-between bg-white dark:bg-slate-900/30">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500 shrink-0" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Recent Activities
                </h2>
              </div>
              {activities.length > 0 && (
                <button
                  onClick={() => {
                    clearLogs();
                    toast.success('Activity logs cleared');
                  }}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                  title="Clear history logs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-1.5 scrollbar-thin">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center select-none">
                  <Activity className="h-7 w-7 text-slate-300 dark:text-slate-800 mb-2" />
                  <span className="text-xs font-semibold text-slate-500">No activity logged yet</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 max-w-xs">
                    Your notes, agenda items, Focus sessions, and AI suggestions will be tracked here.
                  </span>
                </div>
              ) : (
                activities.slice(0, 10).map((act) => {
                  let badgeBg = 'bg-slate-50 text-slate-500 dark:bg-slate-950 dark:text-slate-400';
                  let ActIcon = Clock;

                  if (act.type === 'note') {
                    badgeBg = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450';
                    ActIcon = FileText;
                  } else if (act.type === 'todo') {
                    badgeBg = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-450';
                    ActIcon = CheckCircle2;
                  } else if (act.type === 'ai') {
                    badgeBg = 'bg-purple-50 text-purple-650 dark:bg-purple-950/30 dark:text-purple-450';
                    ActIcon = BrainCircuit;
                  } else if (act.type === 'focus') {
                    badgeBg = 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-450';
                    ActIcon = Clock;
                  } else if (act.type === 'system') {
                    badgeBg = 'bg-blue-50 text-blue-650 dark:bg-blue-950/30 dark:text-blue-450';
                    ActIcon = Settings;
                  }

                  // Relative time calculation helper (inline)
                  const getRelativeTime = (ts: string) => {
                    const diffMs = new Date().getTime() - new Date(ts).getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    if (diffMins < 1) return 'just now';
                    if (diffMins < 60) return `${diffMins}m ago`;
                    const diffHours = Math.floor(diffMins / 60);
                    if (diffHours < 24) return `${diffHours}h ago`;
                    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  };

                  return (
                    <div key={act.id} className="flex gap-3 items-start group select-none text-[11px]">
                      <div className={cn("h-7 w-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100/10", badgeBg)}>
                        <ActIcon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-700 dark:text-slate-300 break-words pr-2">
                          {act.action}
                        </p>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-0.5">
                          {getRelativeTime(act.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-800/20 text-center select-none">
            <span className="text-[10px] text-slate-400 font-bold">
              Showing last {Math.min(activities.length, 10)} operations
            </span>
          </div>
        </div>

      </div>

      {/* 5. Pinned Notes Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 select-none">
            <Pin className="h-5 w-5 text-indigo-500 rotate-45 shrink-0" />
            <span>Pinned Workspace Notes</span>
          </h2>
          <button
            onClick={() => navigate('/notes')}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-600 cursor-pointer"
          >
            Go to Notes
          </button>
        </div>

        {pinnedNotes.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 flex flex-col items-center justify-center text-center select-none bg-white dark:bg-slate-900/30">
            <Pin className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-3" />
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">No Pinned Notes</span>
            <span className="text-xs text-slate-400 mt-1 max-w-xs">
              Go to your Notes space, create a note, and toggle "Pin to Home" to display it on this dashboard.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pinnedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => navigate('/notes')}
                className="glass-panel glass-panel-hover rounded-3xl overflow-hidden cursor-pointer flex flex-col group relative bg-white dark:bg-slate-900/30"
              >
                {/* Optional visual cover image */}
                {note.image_url && (
                  <div className="h-32 w-full overflow-hidden relative">
                    <img 
                      src={note.image_url} 
                      alt={note.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-[0.95]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  </div>
                )}
                
                <div className="p-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-500 transition-colors truncate pr-4">
                      {note.title}
                    </h3>
                    <Pin className="h-3.5 w-3.5 text-indigo-500 rotate-45 shrink-0" />
                  </div>
                  {/* Safely strip out HTML tags from rich editor content for snippet view */}
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-3 leading-relaxed">
                    {note.content.replace(/<[^>]*>/g, '') || 'Empty note content...'}
                  </p>
                  <span className="text-[10px] text-slate-300 dark:text-slate-700 font-bold self-end mt-4">
                    {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNoteStore } from '../../store/noteStore';
import { useTodoStore } from '../../store/todoStore';
import { useThemeStore } from '../../store/themeStore';
import { 
  Search, 
  FileText, 
  CheckSquare, 
  Settings, 
  Moon, 
  Sun, 
  Palette, 
  Layout, 
  Plus, 
  Sparkles,
  Command,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTodoModal: () => void;
  onOpenNoteModal: () => void;
}

interface PaletteItem {
  id: string;
  category: 'Pages' | 'Quick Actions' | 'Notes' | 'Tasks' | 'Themes';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose,
  onOpenTodoModal,
  onOpenNoteModal
}) => {
  const navigate = useNavigate();
  const notes = useNoteStore(state => state.notes);
  const todos = useTodoStore(state => state.todos);
  const themeStore = useThemeStore();
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('myspace_recent_searches');
    return saved ? JSON.parse(saved) : ['Linear design theme', 'Sprint reviews', 'Create new Note'];
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load and fetch todos/notes when palette is opened
  useEffect(() => {
    if (isOpen) {
      useTodoStore.getState().fetchTodos();
      useNoteStore.getState().fetchNotes();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keep selected item visible in scroll view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const saveRecentSearch = (searchText: string) => {
    if (!searchText.trim()) return;
    const updated = [searchText, ...recentSearches.filter(s => s !== searchText)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('myspace_recent_searches', JSON.stringify(updated));
  };

  // Compile all available actions & commands
  const allItems: PaletteItem[] = [
    // 1. Pages Navigation
    {
      id: 'nav-home',
      category: 'Pages',
      title: 'Go to Home Dashboard',
      subtitle: 'System widgets, Pomodoro Focus, and overview',
      icon: <Sparkles className="h-4 w-4" />,
      action: () => { navigate('/'); onClose(); }
    },
    {
      id: 'nav-todo',
      category: 'Pages',
      title: 'Go to Todo Calendar & Kanban',
      subtitle: 'Schedule meetings and drag todo tasks',
      icon: <CheckSquare className="h-4 w-4" />,
      action: () => { navigate('/todo'); onClose(); }
    },
    {
      id: 'nav-notes',
      category: 'Pages',
      title: 'Go to Notes Space',
      subtitle: 'Rich text TipTap documents & files storage',
      icon: <FileText className="h-4 w-4" />,
      action: () => { navigate('/notes'); onClose(); }
    },
    {
      id: 'nav-formatter',
      category: 'Pages',
      title: 'Go to AI Copywriter Formatter',
      subtitle: 'Optimize, shorten, or enlarge document text',
      icon: <Settings className="h-4 w-4" />,
      action: () => { navigate('/formatter'); onClose(); }
    },
    {
      id: 'nav-generator',
      category: 'Pages',
      title: 'Go to AI Templates Generator',
      subtitle: 'LinkedIn posts optimization & email tone writers',
      icon: <Sparkles className="h-4 w-4" />,
      action: () => { navigate('/generator'); onClose(); }
    },
    {
      id: 'nav-settings',
      category: 'Pages',
      title: 'Go to Workspace Settings',
      subtitle: 'Modify usernames, visual colors, and layout skins',
      icon: <Settings className="h-4 w-4" />,
      action: () => { navigate('/settings'); onClose(); }
    },

    // 2. Quick Operations
    {
      id: 'action-new-todo',
      category: 'Quick Actions',
      title: 'Create New Task (Todo)',
      subtitle: 'Quickly insert a schedule item or priority card',
      icon: <Plus className="h-4 w-4 text-emerald-500" />,
      action: () => { onClose(); setTimeout(onOpenTodoModal, 100); }
    },
    {
      id: 'action-new-note',
      category: 'Quick Actions',
      title: 'Create New Document (Note)',
      subtitle: 'Spawn a clean block-style Rich Editor page',
      icon: <Plus className="h-4 w-4 text-indigo-500" />,
      action: () => { onClose(); setTimeout(onOpenNoteModal, 100); }
    },

    // 3. Theme Controls
    {
      id: 'theme-light',
      category: 'Themes',
      title: 'Switch Visuals to Light Aesthetic',
      subtitle: 'Clean light mode representation',
      icon: <Sun className="h-4 w-4 text-amber-500" />,
      action: () => { themeStore.setTheme('light'); onClose(); }
    },
    {
      id: 'theme-dark',
      category: 'Themes',
      title: 'Switch Visuals to Midnight Dark',
      subtitle: 'Deep premium slate dark representation',
      icon: <Moon className="h-4 w-4 text-indigo-400" />,
      action: () => { themeStore.setTheme('dark'); onClose(); }
    },
    {
      id: 'theme-system',
      category: 'Themes',
      title: 'Switch Theme to System Default',
      subtitle: 'Bind theme to browser settings preferences',
      icon: <Layout className="h-4 w-4 text-slate-400" />,
      action: () => { themeStore.setTheme('system'); onClose(); }
    },
    {
      id: 'accent-blue',
      category: 'Themes',
      title: 'Change Accent to Ocean Blue',
      subtitle: 'Stylize buttons and visual highlights to blue',
      icon: <Palette className="h-4 w-4 text-blue-500" />,
      action: () => { themeStore.setAccentColor('blue'); onClose(); }
    },
    {
      id: 'accent-purple',
      category: 'Themes',
      title: 'Change Accent to Royal Violet',
      subtitle: 'Stylize highlights to royal purple',
      icon: <Palette className="h-4 w-4 text-purple-500" />,
      action: () => { themeStore.setAccentColor('purple'); onClose(); }
    },
    {
      id: 'accent-green',
      category: 'Themes',
      title: 'Change Accent to Forest Mint',
      subtitle: 'Stylize highlights to forest green',
      icon: <Palette className="h-4 w-4 text-green-500" />,
      action: () => { themeStore.setAccentColor('green'); onClose(); }
    },
    {
      id: 'accent-orange',
      category: 'Themes',
      title: 'Change Accent to Sunset Orange',
      subtitle: 'Stylize highlights to bright orange',
      icon: <Palette className="h-4 w-4 text-orange-500" />,
      action: () => { themeStore.setAccentColor('orange'); onClose(); }
    },

    // 4. Notes search items
    ...notes.map(note => ({
      id: `note-search-${note.id}`,
      category: 'Notes' as const,
      title: note.title || 'Untitled note',
      subtitle: `Open note saved at: ${new Date(note.created_at).toLocaleDateString()}`,
      icon: <FileText className="h-4 w-4 text-brand-500" />,
      action: () => {
        saveRecentSearch(note.title);
        navigate('/notes');
        onClose();
        // Trigger small broadcast to highlight/open note in Notes page if listening
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-palette-note', { detail: note.id }));
        }, 150);
      }
    })),

    // 5. Tasks search items
    ...todos.map(todo => ({
      id: `todo-search-${todo.id}`,
      category: 'Tasks' as const,
      title: todo.title,
      subtitle: `Task schedule: ${todo.todo_date} ${todo.todo_time || ''} (${todo.status})`,
      icon: (
        <CheckSquare className={cn(
          "h-4 w-4", 
          todo.status === 'completed' ? "text-emerald-500" : "text-slate-400"
        )} />
      ),
      action: () => {
        saveRecentSearch(todo.title);
        navigate('/todo');
        onClose();
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-palette-todo', { detail: todo.id }));
        }, 150);
      }
    }))
  ];

  // Filtering based on fuzzy search matches
  const filteredItems = allItems.filter(item => {
    const searchStr = `${item.title} ${item.subtitle || ''} ${item.category}`.toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });

  // Handle escape, arrows and enter keys
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredItems.length > 0) {
          setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredItems.length > 0) {
          setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, isOpen, onClose, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Blurred background overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200" 
        onClick={onClose}
      />

      {/* Center modal window */}
      <div className="relative w-full max-w-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden glass-panel flex flex-col max-h-[60vh] animate-slide-up">
        {/* Search header bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/40">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search across your space..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-md">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </kbd>
        </div>

        {/* Suggestion list */}
        <div className="flex-1 overflow-y-auto px-2 py-3" ref={listRef}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-left select-none cursor-pointer group",
                    isSelected
                      ? "bg-brand-500 text-white shadow-md shadow-brand-500/10"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={cn(
                      "p-2 rounded-xl shrink-0 transition-colors",
                      isSelected 
                        ? "bg-white/20 text-white" 
                        : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    )}>
                      {item.icon}
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 group-hover:text-slate-500 group-[.bg-brand-500]:text-brand-100/80 mb-0.5">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold truncate">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span className={cn(
                          "text-[10px] truncate leading-normal mt-0.5",
                          isSelected ? "text-brand-50/70" : "text-slate-400 dark:text-slate-500"
                        )}>
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <ArrowRight className="h-4 w-4 text-white shrink-0 mr-1 animate-pulse" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <Search className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3 stroke-dasharray animate-pulse" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                No matching results found
              </span>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                Check spelling or type general navigation terms like "Notes", "Todo", "Accents", or "Aesthetics".
              </p>
            </div>
          )}
        </div>

        {/* Action helper footer */}
        {filteredItems.length > 0 && (
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded">Enter</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded">Esc</kbd>
                <span>Close</span>
              </span>
            </div>
            <span>{filteredItems.length} command options</span>
          </div>
        )}
      </div>
    </div>
  );
};

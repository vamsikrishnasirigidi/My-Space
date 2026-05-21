import React, { useEffect, useState, useRef } from 'react';
import { useNoteStore } from '../store/noteStore';
import { toast } from '../store/toastStore';
import { useActivityStore } from '../store/activityStore';
import type { Note } from '../types';
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  X, 
  Image as ImageIcon, 
  Eye, 
  EyeOff,
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  List as ListIcon, 
  ListOrdered,
  Quote, 
  Code,
  Undo,
  Redo,
  Sparkles,
  Link2,
  Minus
} from 'lucide-react';
import { cn } from '../utils/cn';

// TipTap Rich Editor imports
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import { CodeBlockComponent } from '../components/ui/CodeBlockComponent';

export const NotesPage: React.FC = () => {
  const { notes, fetchNotes, addNote, updateNote, deleteNote, loading } = useNoteStore();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Sidebar editor state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form Fields state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formPinToHome, setFormPinToHome] = useState(false);
  const [showCoverInput, setShowCoverInput] = useState(false);

  // Notion-style slash menu state
  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    query: string;
    index: number;
    coords: { top: number; left: number };
    startPos: number;
  }>({
    isOpen: false,
    query: '',
    index: 0,
    coords: { top: 0, left: 0 },
    startPos: 0,
  });

  const COMMANDS = [
    { id: 'h1', label: 'Heading 1', desc: 'Big section heading', icon: Heading1 },
    { id: 'h2', label: 'Heading 2', desc: 'Medium section heading', icon: Heading2 },
    { id: 'h3', label: 'Heading 3', desc: 'Small section heading', icon: Heading3 },
    { id: 'bullet', label: 'Bulleted List', desc: 'Simple bulleted list', icon: ListIcon },
    { id: 'numbered', label: 'Numbered List', desc: 'Sequential list of items', icon: ListOrdered },
    { id: 'quote', label: 'Quote', desc: 'Capture a quote block', icon: Quote },
    { id: 'code', label: 'Code Block', desc: 'Syntax highlighted code space', icon: Code },
    { id: 'todo', label: 'Todo Checklist', desc: 'Interactive task checklist', icon: ListIcon },
    { id: 'divider', label: 'Divider', desc: 'Insert a visual divider', icon: Minus },
  ];

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.label.toLowerCase().includes(slashMenu.query.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(slashMenu.query.toLowerCase())
  );

  // Stale closures solution
  const slashMenuRef = useRef(slashMenu);
  slashMenuRef.current = slashMenu;
  const filteredCommandsRef = useRef(filteredCommands);
  filteredCommandsRef.current = filteredCommands;

  const handleSelectCommand = (cmd: typeof COMMANDS[0]) => {
    if (!editor) return;

    const { selection } = editor.state;
    const currentPos = selection.from;
    const startPos = slashMenuRef.current.startPos;

    // 1. Delete the slash and query text
    editor.chain().focus().deleteRange({ from: startPos, to: currentPos }).run();

    // 2. Insert the specific block
    switch (cmd.id) {
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'bullet':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'numbered':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'code':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'todo':
        // Simulating todo item with interactive bullet
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'divider':
        editor.chain().focus().setHorizontalRule().run();
        break;
      default:
        break;
    }

    setSlashMenu(prev => ({ ...prev, isOpen: false }));
  };

  const handleSelectCommandRef = useRef(handleSelectCommand);
  handleSelectCommandRef.current = handleSelectCommand;

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlock.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }),
    ],
    content: '',
    editorProps: {
      handleKeyDown: (view, event) => {
        const state = slashMenuRef.current;
        const filtered = filteredCommandsRef.current;

        if (state.isOpen) {
          if (event.key === 'ArrowDown') {
            setSlashMenu(prev => ({
              ...prev,
              index: (prev.index + 1) % Math.max(1, filtered.length)
            }));
            return true;
          }
          if (event.key === 'ArrowUp') {
            setSlashMenu(prev => ({
              ...prev,
              index: (prev.index - 1 + filtered.length) % Math.max(1, filtered.length)
            }));
            return true;
          }
          if (event.key === 'Enter') {
            if (filtered[state.index]) {
              handleSelectCommandRef.current(filtered[state.index]);
            }
            return true;
          }
          if (event.key === 'Escape') {
            setSlashMenu(prev => ({ ...prev, isOpen: false }));
            return true;
          }
        }

        if (event.key === '/') {
          const { selection } = view.state;
          const coords = view.coordsAtPos(selection.from);
          let top = coords.bottom + window.scrollY;
          let left = coords.left + window.scrollX;
          
          // Adjust top if it goes off bottom of viewport
          if (coords.bottom + 250 > window.innerHeight) {
            top = coords.top + window.scrollY - 260;
          }

          setSlashMenu({
            isOpen: true,
            query: '',
            index: 0,
            coords: { top, left },
            startPos: selection.from,
          });
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      setFormContent(editor.getHTML());

      const state = slashMenuRef.current;
      if (state.isOpen) {
        const { selection } = editor.state;
        const currentPos = selection.from;
        if (currentPos <= state.startPos) {
          setSlashMenu(prev => ({ ...prev, isOpen: false }));
        } else {
          const text = editor.state.doc.textBetween(state.startPos + 1, currentPos);
          if (text.includes(' ') || text.includes('\n')) {
            setSlashMenu(prev => ({ ...prev, isOpen: false }));
          } else {
            setSlashMenu(prev => ({ ...prev, query: text, index: 0 }));
          }
        }
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const state = slashMenuRef.current;
      if (state.isOpen) {
        const { selection } = editor.state;
        const currentPos = selection.from;
        if (currentPos < state.startPos || currentPos > state.startPos + state.query.length + 5) {
          setSlashMenu(prev => ({ ...prev, isOpen: false }));
        }
      }
    }
  });

  // Autosave notes debouncer (1.5s)
  useEffect(() => {
    if (!editingNote || !isModalOpen) return;
    
    // Check if the content has changed from the note's base values
    if (formTitle === editingNote.title && formContent === editingNote.content) {
      return;
    }
    
    const delayDebounce = setTimeout(async () => {
      try {
        await updateNote(editingNote.id, {
          title: formTitle,
          content: formContent,
        });
        setEditingNote(prev => prev ? { ...prev, title: formTitle, content: formContent } : null);
        toast.success('Draft autosaved');
      } catch (err) {
        // Silently capture any errors during background sync
      }
    }, 1500);

    return () => clearTimeout(delayDebounce);
  }, [formContent, formTitle, editingNote, isModalOpen, updateNote]);

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Synchronize editor content when opening a note or creating one
  useEffect(() => {
    if (editor && isModalOpen) {
      editor.commands.setContent(formContent);
    }
  }, [formContent, editor, isModalOpen]);

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('<p></p>');
    setFormImageUrl('');
    setFormPinToHome(false);
    setShowCoverInput(false);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormImageUrl(note.image_url || '');
    setFormPinToHome(note.show_in_home);
    setShowCoverInput(!!note.image_url);
    setIsModalOpen(true);
  };

  // Save / Update Notes Submit
  const handleSaveNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Note title is required');
      return;
    }

    try {
      if (editingNote) {
        // Edit Mode
        await updateNote(editingNote.id, {
          title: formTitle,
          content: formContent,
          image_url: formImageUrl || undefined,
          show_in_home: formPinToHome,
        });
        toast.success('Note saved successfully');
        useActivityStore.getState().addLog('note', `Updated note: "${formTitle}"`);
      } else {
        // Create Mode
        await addNote({
          title: formTitle,
          content: formContent,
          image_url: formImageUrl || undefined,
          show_in_home: formPinToHome,
        });
        toast.success('Note created successfully');
        useActivityStore.getState().addLog('note', `Created note: "${formTitle}"`);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to save note');
    }
  };

  // Delete note
  const handleDeleteNoteClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        const titleToLog = editingNote?.title || 'Untitled note';
        await deleteNote(id);
        toast.success('Note deleted successfully');
        useActivityStore.getState().addLog('note', `Deleted note: "${titleToLog}"`);
        setIsModalOpen(false);
      } catch (err) {
        toast.error('Failed to delete note');
      }
    }
  };

  // Toggle home-pin directly from grid
  const handleTogglePin = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateNote(note.id, { show_in_home: !note.show_in_home });
      toast.success(note.show_in_home ? 'Note removed from dashboard' : 'Note pinned to dashboard');
      useActivityStore.getState().addLog('note', note.show_in_home ? `Unpinned note from dashboard: "${note.title}"` : `Pinned note to dashboard: "${note.title}"`);
    } catch (err) {
      toast.error('Failed to toggle pin');
    }
  };

  // Handle local image file uploads and convert to base64
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image is too large. Keep it under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormImageUrl(base64String);
        toast.success('Cover image uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter notes list by search query
  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative min-h-[calc(100vh-8rem)]">
      {/* 1. Header Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 select-none">
            Workspace Notes
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Organize recipes, code drafts, and manifestos.
          </p>
        </div>

        {/* Search Notes */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* 2. Visual Notes Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/20 border-t-indigo-500" />
          <span className="text-sm font-semibold text-slate-400 mt-4">Loading workspace...</span>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 flex flex-col items-center justify-center text-center select-none flex-1">
          <FileTextIcon className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-600 dark:text-slate-300">No notes found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-normal">
            Create your first document using the floating action button below and unlock blocks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => handleOpenEditModal(note)}
              className="glass-panel glass-panel-hover rounded-3xl overflow-hidden cursor-pointer flex flex-col group relative border border-slate-200/40 dark:border-slate-800/20 bg-white dark:bg-slate-900/40"
            >
              {/* Cover Banner */}
              {note.image_url && (
                <div className="h-32 w-full overflow-hidden relative">
                  <img
                    src={note.image_url}
                    alt={note.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 brightness-95"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </div>
              )}

              <div className="p-5 flex flex-col justify-between flex-1 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-500 transition-colors truncate pr-6">
                      {note.title}
                    </h3>
                    <button
                      onClick={e => handleTogglePin(note, e)}
                      className={cn(
                        "p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors shrink-0 cursor-pointer",
                        note.show_in_home ? "text-indigo-500 rotate-45" : "text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                      title={note.show_in_home ? 'Unpin note' : 'Pin note to dashboard'}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Clean snippet preview */}
                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-3 leading-relaxed">
                    {note.content.replace(/<[^>]*>/g, '') || 'Empty note content...'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100/50 dark:border-slate-800/10">
                  <span className="text-[10px] text-slate-300 dark:text-slate-700 font-bold">
                    {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteNoteClick(note.id);
                    }}
                    className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                    title="Delete note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Floating Add Button */}
      <button
        onClick={handleOpenAddModal}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg hover:shadow-premium shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Add note"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* 4. Sliding / Open Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-slate-900/40 backdrop-blur-xs">
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-4xl h-[90vh] glass-panel rounded-3xl overflow-hidden shadow-premium border border-slate-200/60 dark:border-slate-800/40 animate-slide-up flex flex-col"
          >
            {/* Cover Header Image if present */}
            {formImageUrl && (
              <div className="h-40 w-full overflow-hidden relative shrink-0">
                <img
                  src={formImageUrl}
                  alt="Note Cover"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setFormImageUrl('')}
                  className="absolute bottom-4 right-4 bg-slate-900/60 backdrop-blur-md hover:bg-slate-900 border border-white/20 px-3 py-1.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Cover</span>
                </button>
              </div>
            )}

            {/* Note Editor Header */}
            <div className="flex h-14 items-center justify-between border-b border-slate-200/50 dark:border-slate-800/20 px-6 shrink-0 bg-white/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {editingNote ? 'Edit Workspace Note' : 'Draft New Note'}
                </span>
                <span className="text-slate-300 dark:text-slate-800 font-light">|</span>
                <button
                  type="button"
                  onClick={() => setShowCoverInput(!showCoverInput)}
                  className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>{formImageUrl ? 'Change Cover' : 'Add Cover Image'}</span>
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Note Editor Body (Flexible Scroll container) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 bg-white dark:bg-slate-950/30">
              {/* Optional Cover Inputs */}
              {showCoverInput && (
                <div className="p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/20 bg-slate-50 dark:bg-slate-900/30 flex flex-col sm:flex-row gap-4 items-center animate-fade-in shrink-0">
                  <div className="flex-1 w-full flex flex-col gap-1.5">
                    <label className="text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Link2 className="h-3 w-3" />
                      <span>Paste Image URL</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formImageUrl}
                      onChange={e => setFormImageUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="h-px sm:h-8 w-full sm:w-px bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="flex flex-col gap-1.5 w-full sm:w-auto self-stretch sm:self-auto justify-end">
                    <label className="text-xxs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      <span>Local Upload</span>
                    </label>
                    <label className="px-4 py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 flex items-center gap-1.5 cursor-pointer justify-center">
                      <Plus className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLocalImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Title input borderless & large */}
              <input
                type="text"
                required
                placeholder="Untitled Note"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="w-full text-3xl font-extrabold tracking-tight bg-transparent border-0 outline-none text-slate-900 dark:text-white placeholder-slate-200 dark:placeholder-slate-800 focus:ring-0 px-0"
              />

              {/* TIPTAP RICH TEXT EDITOR CONTAINER */}
              <div className="flex flex-col flex-1 border border-slate-200/50 dark:border-slate-800/30 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/10 min-h-[300px]">
                {/* Editor Toolbar */}
                {editor && (
                  <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-slate-200/50 dark:border-slate-800/20 bg-slate-50 dark:bg-slate-900/60 shrink-0 select-none">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={cn("p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", editor.isActive('bold') && "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500")}
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={cn("p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", editor.isActive('italic') && "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500")}
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={cn("p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", editor.isActive('heading', { level: 1 }) && "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500")}
                      title="Heading 1"
                    >
                      <Heading1 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={cn("p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", editor.isActive('heading', { level: 2 }) && "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500")}
                      title="Heading 2"
                    >
                      <Heading2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                      className={cn("p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", editor.isActive('heading', { level: 3 }) && "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500")}
                      title="Heading 3"
                    >
                      <Heading3 className="h-4 w-4" />
                    </button>

                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={cn("p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", editor.isActive('bulletList') && "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500")}
                      title="Bullet List"
                    >
                      <ListIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={cn("p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", editor.isActive('orderedList') && "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500")}
                      title="Ordered List"
                    >
                      <ListOrdered className="h-4 w-4" />
                    </button>

                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      className={cn("p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", editor.isActive('blockquote') && "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500")}
                      title="Blockquote"
                    >
                      <Quote className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                      className={cn("p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", editor.isActive('codeBlock') && "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500")}
                      title="Code Block"
                    >
                      <Code className="h-4 w-4" />
                    </button>

                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 flex-1 md:flex-none" />

                    <div className="flex items-center gap-0.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                        title="Undo"
                      >
                        <Undo className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                        title="Redo"
                      >
                        <Redo className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Editor Content Area */}
                <div className="flex-1 p-4 md:p-5 outline-none overflow-y-auto bg-white dark:bg-slate-900/20">
                  <EditorContent editor={editor} className="min-h-[250px] outline-none" />
                </div>
              </div>
            </div>

            {/* Note Editor Footer */}
            <div className="flex h-16 items-center justify-between border-t border-slate-200/50 dark:border-slate-800/20 px-6 shrink-0 bg-white/50 dark:bg-slate-950/20">
              {/* Home Sync Toggle */}
              <button
                type="button"
                onClick={() => setFormPinToHome(!formPinToHome)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer select-none",
                  formPinToHome
                    ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/40 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50"
                )}
              >
                {formPinToHome ? <Eye className="h-4 w-4 text-indigo-500" /> : <EyeOff className="h-4 w-4" />}
                <span>{formPinToHome ? 'Home Screen Pinned' : 'Show in Dashboard'}</span>
              </button>

              <div className="flex items-center gap-3">
                {/* Delete button if editing */}
                {editingNote && (
                  <button
                    type="button"
                    onClick={() => handleDeleteNoteClick(editingNote.id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer mr-3"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                    <span>Delete Document</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNoteSubmit}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>{editingNote ? 'Save Changes' : 'Create Note'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notion-style Slash Command Menu Portal */}
      {slashMenu.isOpen && filteredCommands.length > 0 && (
        <div
          className="fixed z-50 w-72 glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/40 bg-white/95 dark:bg-slate-900/95 shadow-premium overflow-hidden animate-fade-in p-1.5"
          style={{
            top: `${slashMenu.coords.top}px`,
            left: `${slashMenu.coords.left}px`,
          }}
        >
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 py-1 select-none border-b border-slate-100/50 dark:border-slate-800/20 mb-1">
            Blocks & Commands
          </div>
          <div className="max-h-60 overflow-y-auto pr-0.5 scrollbar-thin">
            {filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === slashMenu.index;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => handleSelectCommand(cmd)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl transition-all select-none cursor-pointer",
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg shrink-0",
                    isSelected ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{cmd.label}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-tight mt-0.5">{cmd.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Internal replacement so Lucide file-text icon resolves uniquely alongside Page Title
const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

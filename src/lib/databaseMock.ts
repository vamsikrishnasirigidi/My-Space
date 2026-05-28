import type { UserProfile, Todo, Note } from '../types';
import { getLocalDateISO } from '../utils/date';

// Mock Seed Data
const DEFAULT_USER: UserProfile = {
  id: 'mock-user-123',
  name: 'Vamsi',
  email: 'vamsi@myspace.app',
  theme: 'light',
  created_at: new Date().toISOString(),
};

const getTodayDateStr = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return getLocalDateISO(d);
};
interface MockSession {
  access_token: string;
  user: UserProfile;
}


const DEFAULT_TODOS = (): Todo[] => [
  {
    id: 'todo-1',
    user_id: 'mock-user-123',
    title: '✨ Review design system specifications',
    description: 'Walk through the Linear and Notion-inspired components, color variables, and transition timings.',
    todo_date: getTodayDateStr(0),
    todo_time: '10:00',
    status: 'in_progress',
    created_at: new Date().toISOString(),
  },
  {
    id: 'todo-2',
    user_id: 'mock-user-123',
    title: '🚀 Connect Supabase PostgreSQL Database',
    description: 'Ensure environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are configured for cloud sync.',
    todo_date: getTodayDateStr(0),
    todo_time: '14:30',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: 'todo-3',
    user_id: 'mock-user-123',
    title: '📝 Master the TipTap Editor functionality',
    description: 'Test heading shortcuts, bullet points, and live cover image attachments in the Notes space.',
    todo_date: getTodayDateStr(0),
    todo_time: '16:00',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: 'todo-4',
    user_id: 'mock-user-123',
    title: '⚡ Configure AI formatter test cases',
    description: 'Check how the "Optimize", "Shorten", and "Enlarge" buttons format custom copywriting drafts.',
    todo_date: getTodayDateStr(-1),
    todo_time: '11:00',
    status: 'completed',
    created_at: new Date().toISOString(),
  },
  {
    id: 'todo-5',
    user_id: 'mock-user-123',
    title: '📅 Weekly planning & dashboard alignment',
    description: 'Set objectives for next sprint and update the task timeline widgets.',
    todo_date: getTodayDateStr(2),
    todo_time: '09:00',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_NOTES = (): Note[] => [
  {
    id: 'note-1',
    user_id: 'mock-user-123',
    title: '💡 My Space Design Manifesto',
    content: `<h2>Welcome to My Space</h2>
<p>This is a complete premium productivity hub engineered for high-performance workflows. It combines three powerful pillars of productivity:</p>
<ul>
  <li><strong>Notion-style note taking</strong> with dynamic formatting.</li>
  <li><strong>Google Calendar-style task planning</strong> for tracking deadlines.</li>
  <li><strong>AI-assisted copywriting automation</strong> for optimizing text instantly.</li>
</ul>
<p>Feel free to customize this note, pin it to your dashboard, or delete it whenever you are ready!</p>`,
    image_url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1000&auto=format&fit=crop',
    show_in_home: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'note-2',
    user_id: 'mock-user-123',
    title: '🚀 Supabase PostgreSQL Schemas',
    content: `<h3>SaaS Database Table Configurations</h3>
<p>To go from local mock database sandboxing to Supabase cloud hosting, run the following SQL tables inside your Supabase SQL editor:</p>
<pre><code>create table public.users (
  id uuid references auth.users primary key,
  name text not null,
  email text not null,
  theme text default 'light'
);</code></pre>
<p>Ensure that row-level security (RLS) is enabled to securely isolate tasks per authenticated user.</p>`,
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
    show_in_home: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'note-3',
    user_id: 'mock-user-123',
    title: '🎨 Color Palette & Typography Guidelines',
    content: `<h3>Harmonic Styling Directives</h3>
<p>Our app incorporates the following styling principles:</p>
<ol>
  <li><strong>Rounded Corners:</strong> Use <code>rounded-2xl</code> and <code>rounded-xl</code> for components.</li>
  <li><strong>Soft Shadows:</strong> Subtle slate shadows mimic real elevations.</li>
  <li><strong>Gradients:</strong> Indigo-to-Blue represents primary CTAs.</li>
</ol>`,
    image_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop',
    show_in_home: false,
    created_at: new Date().toISOString(),
  },
];

// LocalStorage Keys
const KEYS = {
  USER: 'myspace_user',
  TODOS: 'myspace_todos',
  NOTES: 'myspace_notes',
  AUTH: 'myspace_auth_session',
};

// Database Initializers
const initStorage = () => {
  if (!localStorage.getItem(KEYS.USER)) {
    localStorage.setItem(KEYS.USER, JSON.stringify(DEFAULT_USER));
  }
  if (!localStorage.getItem(KEYS.TODOS)) {
    localStorage.setItem(KEYS.TODOS, JSON.stringify(DEFAULT_TODOS()));
  }
  if (!localStorage.getItem(KEYS.NOTES)) {
    localStorage.setItem(KEYS.NOTES, JSON.stringify(DEFAULT_NOTES()));
  }
};

export const databaseMock = {
  // Authentication & Users
  getUser: (): UserProfile => {
    initStorage();
    return JSON.parse(localStorage.getItem(KEYS.USER) || '{}');
  },

  updateUser: (updates: Partial<UserProfile>): UserProfile => {
    initStorage();
    const current = databaseMock.getUser();
    const updated = { ...current, ...updates };
    localStorage.setItem(KEYS.USER, JSON.stringify(updated));
    return updated;
  },

  getSession: () => {
    const session = localStorage.getItem(KEYS.AUTH);
    return session ? JSON.parse(session) : null;
  },

  setSession: (session: MockSession | null) => {
    if (session) {
      localStorage.setItem(KEYS.AUTH, JSON.stringify(session));
    } else {
      localStorage.removeItem(KEYS.AUTH);
    }
  },

  // Todos CRUD
  getTodos: (): Todo[] => {
    initStorage();
    return JSON.parse(localStorage.getItem(KEYS.TODOS) || '[]');
  },

  saveTodos: (todos: Todo[]) => {
    localStorage.setItem(KEYS.TODOS, JSON.stringify(todos));
  },

  createTodo: (todo: Omit<Todo, 'id' | 'created_at' | 'user_id'>): Todo => {
    const todos = databaseMock.getTodos();
    const newTodo: Todo = {
      ...todo,
      id: `todo-${Date.now()}`,
      user_id: 'mock-user-123',
      created_at: new Date().toISOString(),
    };
    todos.unshift(newTodo);
    databaseMock.saveTodos(todos);
    return newTodo;
  },

  updateTodo: (id: string, updates: Partial<Todo>): Todo => {
    const todos = databaseMock.getTodos();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Todo not found');
    
    const updated = { ...todos[idx], ...updates };
    todos[idx] = updated;
    databaseMock.saveTodos(todos);
    return updated;
  },

  deleteTodo: (id: string): void => {
    const todos = databaseMock.getTodos();
    const filtered = todos.filter(t => t.id !== id);
    databaseMock.saveTodos(filtered);
  },

  // Notes CRUD
  getNotes: (): Note[] => {
    initStorage();
    return JSON.parse(localStorage.getItem(KEYS.NOTES) || '[]');
  },

  saveNotes: (notes: Note[]) => {
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  },

  createNote: (note: Omit<Note, 'id' | 'created_at' | 'user_id'>): Note => {
    const notes = databaseMock.getNotes();
    const newNote: Note = {
      ...note,
      id: `note-${Date.now()}`,
      user_id: 'mock-user-123',
      created_at: new Date().toISOString(),
    };
    notes.unshift(newNote);
    databaseMock.saveNotes(notes);
    return newNote;
  },

  updateNote: (id: string, updates: Partial<Note>): Note => {
    const notes = databaseMock.getNotes();
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) throw new Error('Note not found');
    
    const updated = { ...notes[idx], ...updates };
    notes[idx] = updated;
    databaseMock.saveNotes(notes);
    return updated;
  },

  deleteNote: (id: string): void => {
    const notes = databaseMock.getNotes();
    const filtered = notes.filter(n => n.id !== id);
    databaseMock.saveNotes(filtered);
  },
};

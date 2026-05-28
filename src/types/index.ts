export interface UserProfile {
  id: string;
  name: string;
  email: string;
  theme: 'light' | 'dark';
  is_guest?: boolean;
  created_at?: string;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string;
  todo_date: string; // Format: YYYY-MM-DD
  todo_time?: string; // Format: HH:MM (optional)
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string; // Rich Text HTML content from TipTap
  image_url?: string;
  show_in_home: boolean;
  created_at: string;
}

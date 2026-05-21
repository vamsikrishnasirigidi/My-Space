import { create } from 'zustand';
import type { Todo } from '../types';
import { supabase, isMock } from '../lib/supabase';
import { databaseMock } from '../lib/databaseMock';
import { useAuthStore } from './authStore';

interface TodoState {
  todos: Todo[];
  loading: boolean;
  fetchTodos: () => Promise<void>;
  addTodo: (todo: Omit<Todo, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  loading: false,

  fetchTodos: async () => {
    set({ loading: true });
    try {
      if (isMock) {
        // Fetch from local mock storage
        const list = databaseMock.getTodos();
        set({ todos: list, loading: false });
      } else {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        set({ todos: data || [], loading: false });
      }
    } catch (err) {
      console.error('Fetch Todos Error:', err);
      set({ loading: false });
    }
  },

  addTodo: async (todo) => {
    try {
      if (isMock) {
        const newTodo = databaseMock.createTodo(todo);
        set(state => ({ todos: [newTodo, ...state.todos] }));
      } else {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('todos')
          .insert([{ ...todo, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          set(state => ({ todos: [data, ...state.todos] }));
        }
      }
    } catch (err) {
      console.error('Add Todo Error:', err);
      throw err;
    }
  },

  updateTodo: async (id, updates) => {
    try {
      if (isMock) {
        const updated = databaseMock.updateTodo(id, updates);
        set(state => ({
          todos: state.todos.map(t => (t.id === id ? updated : t)),
        }));
      } else {
        const { error } = await supabase
          .from('todos')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
        set(state => ({
          todos: state.todos.map(t => (t.id === id ? { ...t, ...updates } : t)),
        }));
      }
    } catch (err) {
      console.error('Update Todo Error:', err);
      throw err;
    }
  },

  deleteTodo: async (id) => {
    try {
      if (isMock) {
        databaseMock.deleteTodo(id);
        set(state => ({ todos: state.todos.filter(t => t.id !== id) }));
      } else {
        const { error } = await supabase
          .from('todos')
          .delete()
          .eq('id', id);

        if (error) throw error;
        set(state => ({ todos: state.todos.filter(t => t.id !== id) }));
      }
    } catch (err) {
      console.error('Delete Todo Error:', err);
      throw err;
    }
  },
}));

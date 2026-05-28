import { create } from 'zustand';
import type { Note } from '../types';
import { supabase, isMock } from '../lib/supabase';
import { databaseMock } from '../lib/databaseMock';
import { useAuthStore } from './authStore';

interface NoteState {
  notes: Note[];
  loading: boolean;
  fetchNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  loading: false,

  fetchNotes: async () => {
    set({ loading: true });
    try {
      if (isMock) {
        const list = databaseMock.getNotes();
        set({ notes: list, loading: false });
      } else {
        if (!supabase) throw new Error('Supabase client is not initialized.');
        const user = useAuthStore.getState().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        set({ notes: data || [], loading: false });
      }
    } catch (err) {
      console.error('Fetch Notes Error:', err);
      set({ loading: false });
    }
  },

  addNote: async (note) => {
    try {
      if (isMock) {
        const newNote = databaseMock.createNote(note);
        set(state => ({ notes: [newNote, ...state.notes] }));
      } else {
        if (!supabase) throw new Error('Supabase client is not initialized.');
        const user = useAuthStore.getState().user;
        if (!user) return;

        const { data, error } = await supabase
          .from('notes')
          .insert([{ ...note, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          set(state => ({ notes: [data, ...state.notes] }));
        }
      }
    } catch (err) {
      console.error('Add Note Error:', err);
      throw err;
    }
  },

  updateNote: async (id, updates) => {
    try {
      if (isMock) {
        const updated = databaseMock.updateNote(id, updates);
        set(state => ({
          notes: state.notes.map(n => (n.id === id ? updated : n)),
        }));
      } else {
        if (!supabase) throw new Error('Supabase client is not initialized.');
        const { error } = await supabase
          .from('notes')
          .update(updates)
          .eq('id', id);

        if (error) throw error;
        set(state => ({
          notes: state.notes.map(n => (n.id === id ? { ...n, ...updates } : n)),
        }));
      }
    } catch (err) {
      console.error('Update Note Error:', err);
      throw err;
    }
  },

  deleteNote: async (id) => {
    try {
      if (isMock) {
        databaseMock.deleteNote(id);
        set(state => ({ notes: state.notes.filter(n => n.id !== id) }));
      } else {
        if (!supabase) throw new Error('Supabase client is not initialized.');
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', id);

        if (error) throw error;
        set(state => ({ notes: state.notes.filter(n => n.id !== id) }));
      }
    } catch (err) {
      console.error('Delete Note Error:', err);
      throw err;
    }
  },
}));

import { create } from 'zustand';
import type { UserProfile } from '../types';
import { supabase, isMock } from '../lib/supabase';
import { databaseMock } from '../lib/databaseMock';
import { toast } from './toastStore';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, theme: 'light' | 'dark') => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  signInWithGoogle: async () => {
    set({ loading: true });
    try {
      if (isMock) {
        // Simulate a tiny delay for Google Redirect Auth
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockUser = databaseMock.getUser();
        databaseMock.setSession({ access_token: 'mock-token', user: mockUser });
        set({ user: mockUser, loading: false });
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      toast.error(err?.message || 'Google Sign-In failed. Please check your Supabase Dashboard configuration.');
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      if (isMock) {
        await new Promise(resolve => setTimeout(resolve, 500));
        databaseMock.setSession(null);
        set({ user: null, loading: false });
      } else {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        set({ user: null, loading: false });
      }
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      toast.error(err?.message || 'Sign-Out failed.');
      set({ loading: false });
    }
  },

  updateProfile: async (name: string, theme: 'light' | 'dark') => {
    const current = get().user;
    if (!current) return;

    set({ loading: true });
    try {
      if (isMock) {
        const updated = databaseMock.updateUser({ name, theme });
        set({ user: updated, loading: false });
      } else {
        const { error } = await supabase
          .from('users')
          .update({ name, theme })
          .eq('id', current.id);
        
        if (error) throw error;
        set({ user: { ...current, name, theme }, loading: false });
      }
    } catch (err: any) {
      console.error('Update Profile Error:', err);
      toast.error(err?.message || 'Failed to update profile.');
      set({ loading: false });
    }
  },

  checkSession: async () => {
    try {
      if (isMock) {
        const session = databaseMock.getSession();
        if (session) {
          const mockUser = databaseMock.getUser();
          // Keep light/dark settings synchronized with what's stored in mock
          set({ user: mockUser });
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Fetch user profile from public.users
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error || !profile) {
            // Profile doesn't exist yet, insert a default one
            const newProfile: UserProfile = {
              id: session.user.id,
              name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              theme: 'light',
            };
            await supabase.from('users').insert([newProfile]);
            set({ user: newProfile });
          } else {
            set({ user: profile as UserProfile });
          }
        }
      }
    } catch (err: any) {
      console.error('Check Session Error:', err);
      toast.error(err?.message || 'Failed to sync database session. Make sure SQL tables are initialized.');
    } finally {
      set({ loading: false, initialized: true });
    }
  },
}));

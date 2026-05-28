import { create } from 'zustand';
import type { UserProfile } from '../types';
import { supabase, isMock, allowMockAuth } from '../lib/supabase';
import { databaseMock } from '../lib/databaseMock';
import { toast } from './toastStore';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: UserProfile | null;
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  loading: boolean;
  initialized: boolean;
  initializeAuth: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  upgradeGuestAccount: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, theme: 'light' | 'dark') => Promise<void>;
  checkSession: () => Promise<void>;
}

let authListenerInitialized = false;

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
};

const canUseMockAuth = isMock && allowMockAuth;

const ensureSupabaseConfigured = () => {
  if (!canUseMockAuth && isMock) {
    throw new Error(
      'Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.'
    );
  }
};

const isSupabaseGuest = (authUser: User): boolean => {
  const maybeAnonymous = (authUser as { is_anonymous?: boolean }).is_anonymous;
  return Boolean(maybeAnonymous || authUser.user_metadata?.is_guest);
};

const getFallbackProfile = (authUser: User): UserProfile => {
  const guest = isSupabaseGuest(authUser);
  return {
    id: authUser.id,
    name:
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      (guest ? 'Guest User' : authUser.email?.split('@')[0]) ||
      'User',
    email: authUser.email || '',
    theme: 'light',
    is_guest: guest,
  };
};

const generateGuestCredentials = () => {
  const stamp = Date.now();
  const random = Math.random().toString(36).slice(2, 12);
  return {
    email: `guest-${stamp}-${random}@myspace.local`,
    password: `Guest@${random}${stamp}`,
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  currentUser: null,
  isAuthenticated: false,
  isGuest: false,
  loading: false,
  initialized: false,

  initializeAuth: async () => {
    try {
      if (canUseMockAuth) {
        const session = databaseMock.getSession();
        if (session) {
          const mockUser = databaseMock.getUser();
          const nextUser = { ...mockUser, is_guest: Boolean(mockUser.is_guest) };
          set({
            user: nextUser,
            currentUser: nextUser,
            isAuthenticated: true,
            isGuest: Boolean(nextUser.is_guest),
            loading: false,
            initialized: true,
          });
        } else {
          set({
            user: null,
            currentUser: null,
            isAuthenticated: false,
            isGuest: false,
            loading: false,
            initialized: true,
          });
        }
        return;
      }

      ensureSupabaseConfigured();

      if (!supabase) throw new Error('Supabase client is not initialized.');
      const sb = supabase;

      const syncFromSession = async (session: Session | null, event?: AuthChangeEvent) => {
        if (!session?.user) {
          set({
            user: null,
            currentUser: null,
            isAuthenticated: false,
            isGuest: false,
            loading: false,
            initialized: true,
          });
          return;
        }

        const authUser = session.user;
        const fallbackProfile = getFallbackProfile(authUser);

        try {
          const { data: profile } = await sb
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          if (!profile) {
            await sb.from('users').upsert(
              [
                {
                  id: fallbackProfile.id,
                  name: fallbackProfile.name,
                  email: fallbackProfile.email,
                  theme: fallbackProfile.theme,
                  is_guest: fallbackProfile.is_guest,
                },
              ],
              { onConflict: 'id' }
            );
            set({
              user: fallbackProfile,
              currentUser: fallbackProfile,
              isAuthenticated: true,
              isGuest: Boolean(fallbackProfile.is_guest),
              loading: false,
              initialized: true,
            });
            return;
          }

          const normalizedProfile: UserProfile = {
            ...(profile as UserProfile),
            is_guest: Boolean((profile as UserProfile).is_guest ?? fallbackProfile.is_guest),
          };

          set({
            user: normalizedProfile,
            currentUser: normalizedProfile,
            isAuthenticated: true,
            isGuest: Boolean(normalizedProfile.is_guest),
            loading: false,
            initialized: true,
          });
        } catch (syncErr) {
          if (event !== 'TOKEN_REFRESHED') {
            console.error('Auth profile sync error:', syncErr);
          }
          set({
            user: fallbackProfile,
            currentUser: fallbackProfile,
            isAuthenticated: true,
            isGuest: Boolean(fallbackProfile.is_guest),
            loading: false,
            initialized: true,
          });
        }
      };

      if (!authListenerInitialized) {
        sb.auth.onAuthStateChange(async (event, session) => {
          await syncFromSession(session, event);
        });
        authListenerInitialized = true;
      }

      const { data: { session } } = await sb.auth.getSession();
      await syncFromSession(session);
    } catch (err: unknown) {
      console.error('Initialize Auth Error:', err);
      toast.error(getErrorMessage(err, 'Failed to initialize authentication session.'));
      set({
        user: null,
        currentUser: null,
        isAuthenticated: false,
        isGuest: false,
        loading: false,
        initialized: true,
      });
    }
  },

  signUpWithEmail: async (email, password, name) => {
    set({ loading: true });
    try {
      if (canUseMockAuth) {
        const mockUser = databaseMock.updateUser({
          email,
          name: name.trim() || 'User',
          is_guest: false,
        });
        databaseMock.setSession({ access_token: 'mock-token-email', user: mockUser });
        set({
          user: mockUser,
          currentUser: mockUser,
          isAuthenticated: true,
          isGuest: false,
          loading: false,
        });
        toast.success('Account created successfully.');
        return;
      }

      ensureSupabaseConfigured();

      if (!supabase) throw new Error('Supabase client is not initialized.');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
            is_guest: false,
          },
        },
      });
      if (error) throw error;

      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }

      toast.success('Welcome! Your account is ready.');
    } catch (err: unknown) {
      console.error('Email Sign Up Error:', err);
      toast.error(getErrorMessage(err, 'Failed to create account.'));
      set({ loading: false });
    } finally {
      set({ loading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ loading: true });
    try {
      if (canUseMockAuth) {
        const mockUser = databaseMock.getUser();
        databaseMock.setSession({ access_token: 'mock-token-email-login', user: mockUser });
        set({
          user: mockUser,
          currentUser: mockUser,
          isAuthenticated: true,
          isGuest: Boolean(mockUser.is_guest),
          loading: false,
        });
        return;
      }

      ensureSupabaseConfigured();

      if (!supabase) throw new Error('Supabase client is not initialized.');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: unknown) {
      console.error('Email Sign In Error:', err);
      toast.error(getErrorMessage(err, 'Invalid email or password.'));
      set({ loading: false });
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true });
    try {
      if (canUseMockAuth) {
        // Simulate a tiny delay for Google Redirect Auth
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockUser = databaseMock.updateUser({ is_guest: false });
        databaseMock.setSession({ access_token: 'mock-token', user: mockUser });
        set({
          user: mockUser,
          currentUser: mockUser,
          isAuthenticated: true,
          isGuest: false,
          loading: false,
        });
      } else {
        ensureSupabaseConfigured();
        if (!supabase) throw new Error('Supabase client is not initialized.');
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      console.error('Google Sign In Error:', err);
      toast.error(getErrorMessage(err, 'Google Sign-In failed. Please check your Supabase Dashboard configuration.'));
      set({ loading: false });
    }
  },

  signInAsGuest: async () => {
    set({ loading: true });
    try {
      if (canUseMockAuth) {
        const mockUser = databaseMock.updateUser({
          name: 'Guest User',
          email: '',
          is_guest: true,
        });
        databaseMock.setSession({ access_token: 'mock-token-guest', user: mockUser });
        set({
          user: mockUser,
          currentUser: mockUser,
          isAuthenticated: true,
          isGuest: true,
          loading: false,
        });
        toast.success('Signed in as guest.');
        return;
      }

      ensureSupabaseConfigured();

      if (!supabase) throw new Error('Supabase client is not initialized.');

      const { error: anonymousError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            is_guest: true,
            name: 'Guest User',
          },
        },
      });

      if (!anonymousError) {
        toast.success('Signed in as guest.');
        return;
      }

      const tempCredentials = generateGuestCredentials();
      const { error: signUpError } = await supabase.auth.signUp({
        email: tempCredentials.email,
        password: tempCredentials.password,
        options: {
          data: {
            is_guest: true,
            full_name: 'Guest User',
          },
        },
      });
      if (signUpError) throw signUpError;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: tempCredentials.email,
        password: tempCredentials.password,
      });
      if (signInError) throw signInError;

      toast.success('Signed in as guest.');
    } catch (err: unknown) {
      console.error('Guest Sign In Error:', err);
      toast.error(getErrorMessage(err, 'Unable to continue as guest.'));
      set({ loading: false });
    } finally {
      set({ loading: false });
    }
  },

  sendPasswordResetEmail: async (email: string) => {
    set({ loading: true });
    try {
      if (canUseMockAuth) {
        await new Promise(resolve => setTimeout(resolve, 600));
        toast.success('Mock reset email sent. Check your inbox.');
        return;
      }
      ensureSupabaseConfigured();
      if (!supabase) throw new Error('Supabase client is not initialized.');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset email sent.');
    } catch (err: unknown) {
      console.error('Reset Email Error:', err);
      toast.error(getErrorMessage(err, 'Failed to send reset email.'));
    } finally {
      set({ loading: false });
    }
  },

  updatePassword: async (newPassword: string) => {
    set({ loading: true });
    try {
      if (canUseMockAuth) {
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success('Password updated successfully.');
        return;
      }
      ensureSupabaseConfigured();
      if (!supabase) throw new Error('Supabase client is not initialized.');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully.');
    } catch (err: unknown) {
      console.error('Update Password Error:', err);
      toast.error(getErrorMessage(err, 'Failed to update password.'));
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    const current = get().user;
    if (!current?.email || current.is_guest) {
      toast.error('Guest accounts cannot change password.');
      return;
    }

    set({ loading: true });
    try {
      if (canUseMockAuth) {
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success('Password changed successfully.');
        return;
      }

      ensureSupabaseConfigured();
      if (!supabase) throw new Error('Supabase client is not initialized.');

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: current.email,
        password: currentPassword,
      });
      if (verifyError) throw new Error('Current password is incorrect.');

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      toast.success('Password changed successfully.');
    } catch (err: unknown) {
      console.error('Change Password Error:', err);
      toast.error(getErrorMessage(err, 'Failed to change password.'));
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  upgradeGuestAccount: async (email, password, name) => {
    const current = get().user;
    if (!current || !current.is_guest) {
      toast.error('Only guest accounts can be upgraded.');
      return;
    }

    set({ loading: true });
    try {
      if (canUseMockAuth) {
        const updated = databaseMock.updateUser({
          email,
          name: name.trim() || 'User',
          is_guest: false,
        });
        set({
          user: updated,
          currentUser: updated,
          isAuthenticated: true,
          isGuest: false,
          loading: false,
        });
        toast.success('Guest account upgraded successfully.');
        return;
      }

      ensureSupabaseConfigured();

      if (!supabase) throw new Error('Supabase client is not initialized.');

      const { error: authError } = await supabase.auth.updateUser({
        email,
        password,
        data: {
          full_name: name.trim(),
          is_guest: false,
        },
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('users')
        .update({ email, name: name.trim(), is_guest: false })
        .eq('id', current.id);
      if (profileError) throw profileError;

      const refreshed = { ...current, email, name: name.trim(), is_guest: false };
      set({
        user: refreshed,
        currentUser: refreshed,
        isGuest: false,
      });
      toast.success('Guest account upgraded successfully.');
    } catch (err: unknown) {
      console.error('Upgrade Guest Error:', err);
      toast.error(getErrorMessage(err, 'Failed to upgrade guest account.'));
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      if (canUseMockAuth) {
        await new Promise(resolve => setTimeout(resolve, 500));
        databaseMock.setSession(null);
        set({
          user: null,
          currentUser: null,
          isAuthenticated: false,
          isGuest: false,
          loading: false,
        });
      } else {
        ensureSupabaseConfigured();
        if (!supabase) throw new Error('Supabase client is not initialized.');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        set({
          user: null,
          currentUser: null,
          isAuthenticated: false,
          isGuest: false,
          loading: false,
        });
      }
    } catch (err: unknown) {
      console.error('Sign Out Error:', err);
      toast.error(getErrorMessage(err, 'Sign-Out failed.'));
      set({ loading: false });
    }
  },

  updateProfile: async (name: string, theme: 'light' | 'dark') => {
    const current = get().user;
    if (!current) return;

    set({ loading: true });
    try {
      if (canUseMockAuth) {
        const updated = databaseMock.updateUser({ name, theme });
        set({
          user: updated,
          currentUser: updated,
          isAuthenticated: true,
          isGuest: Boolean(updated.is_guest),
          loading: false,
        });
      } else {
        ensureSupabaseConfigured();
        if (!supabase) throw new Error('Supabase client is not initialized.');
        const { error } = await supabase
          .from('users')
          .update({ name, theme })
          .eq('id', current.id);
        
        if (error) throw error;
        const next = { ...current, name, theme };
        set({
          user: next,
          currentUser: next,
          isAuthenticated: true,
          isGuest: Boolean(next.is_guest),
          loading: false,
        });
      }
    } catch (err: unknown) {
      console.error('Update Profile Error:', err);
      toast.error(getErrorMessage(err, 'Failed to update profile.'));
      set({ loading: false });
    }
  },

  checkSession: async () => {
    await get().initializeAuth();
  },
}));

import { create } from 'zustand';
import type { UserProfile } from '../types';
import { supabase, isMock, allowMockAuth } from '../lib/supabase';
import { databaseMock } from '../lib/databaseMock';
import { toast } from './toastStore';
import { getPersistedProfileTheme } from '../utils/theme';
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
let authInitPromise: Promise<void> | null = null;

const AUTH_INIT_TIMEOUT_MS = 8000;
const PROFILE_FETCH_TIMEOUT_MS = 5000;

const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const setUnauthenticated = (set: (partial: Partial<AuthState>) => void) => {
  set({
    user: null,
    currentUser: null,
    isAuthenticated: false,
    isGuest: false,
    loading: false,
    initialized: true,
  });
};

const setAuthenticated = (
  set: (partial: Partial<AuthState>) => void,
  profile: UserProfile
) => {
  set({
    user: profile,
    currentUser: profile,
    isAuthenticated: true,
    isGuest: Boolean(profile.is_guest),
    loading: false,
    initialized: true,
  });
};

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
    theme: getPersistedProfileTheme(),
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
    if (get().initialized) return;
    if (authInitPromise) return authInitPromise;

    authInitPromise = (async () => {
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

      const hydrateProfileFromDb = async (authUser: User, fallbackProfile: UserProfile) => {
        try {
          const { data: profile } = await withTimeout(
            (async () =>
              sb.from('users').select('*').eq('id', authUser.id).maybeSingle())(),
            PROFILE_FETCH_TIMEOUT_MS,
            'Profile fetch'
          );

          if (!profile) {
            void sb.from('users').upsert(
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
            return;
          }

          const normalizedProfile: UserProfile = {
            ...(profile as UserProfile),
            is_guest: Boolean((profile as UserProfile).is_guest ?? fallbackProfile.is_guest),
          };
          setAuthenticated(set, normalizedProfile);
        } catch (syncErr) {
          console.warn('Profile hydrate skipped:', syncErr);
        }
      };

      const syncFromSession = (session: Session | null, event?: AuthChangeEvent) => {
        if (!session?.user) {
          const signedOut =
            event === 'SIGNED_OUT' ||
            (event === 'INITIAL_SESSION' && !get().isAuthenticated);

          if (signedOut || !get().isAuthenticated) {
            setUnauthenticated(set);
          }
          return;
        }

        if (event === 'TOKEN_REFRESHED' && get().isAuthenticated) {
          return;
        }

        const fallbackProfile = getFallbackProfile(session.user);
        setAuthenticated(set, fallbackProfile);
        void hydrateProfileFromDb(session.user, fallbackProfile);
      };

      if (!authListenerInitialized) {
        sb.auth.onAuthStateChange((event, session) => {
          setTimeout(() => {
            syncFromSession(session, event);
          }, 0);
        });
        authListenerInitialized = true;
      }

      let session: Session | null = null;
      try {
        const { data } = await withTimeout(
          sb.auth.getSession(),
          AUTH_INIT_TIMEOUT_MS,
          'Auth session'
        );
        session = data.session;
      } catch (sessionErr) {
        console.warn('getSession slow or failed, continuing:', sessionErr);
      }

      syncFromSession(session, 'INITIAL_SESSION');

      if (!get().initialized) {
        setUnauthenticated(set);
      }
    } catch (err: unknown) {
      console.error('Initialize Auth Error:', err);
      toast.error(getErrorMessage(err, 'Failed to initialize authentication session.'));
      setUnauthenticated(set);
    } finally {
      if (!get().initialized) {
        setUnauthenticated(set);
      }
      authInitPromise = null;
    }
    })();

    return authInitPromise;
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
            redirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        set({ loading: false });
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

    const silent = get().initialized && get().isAuthenticated;
    if (!silent) set({ loading: true });
    try {
      if (canUseMockAuth) {
        const updated = databaseMock.updateUser({ name, theme });
        set({
          user: updated,
          currentUser: updated,
          isAuthenticated: true,
          isGuest: Boolean(updated.is_guest),
          ...(silent ? {} : { loading: false }),
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
          ...(silent ? {} : { loading: false }),
        });
      }
    } catch (err: unknown) {
      console.error('Update Profile Error:', err);
      toast.error(getErrorMessage(err, 'Failed to update profile.'));
      if (!silent) set({ loading: false });
    }
  },

  checkSession: async () => {
    await get().initializeAuth();
  },
}));

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Mail, Moon, Sun, UserPlus, UserRoundX } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { toast } from '../store/toastStore';
import { cn } from '../utils/cn';

type AuthMode = 'signin' | 'signup' | 'forgot';

export const Login: React.FC = () => {
  const {
    user,
    isAuthenticated,
    initialized,
    loading,
    initializeAuth,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordResetEmail,
    signInAsGuest,
  } = useAuthStore();
  const theme = useThemeStore(state => state.theme);
  const setTheme = useThemeStore(state => state.setTheme);

  const [mode, setMode] = useState<AuthMode>('signin');
  const [isHovered, setIsHovered] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initializeAuth();
    }
  }, [initializeAuth, initialized]);

  const clearFields = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleModeSwitch = (nextMode: AuthMode) => {
    setMode(nextMode);
    clearFields();
    setEmailTouched(false);
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedEmail = email.trim();
  const isEmailValid = emailRegex.test(trimmedEmail);
  const hasMinPassword = password.length >= 8;
  const canSubmit =
    mode === 'forgot'
      ? isEmailValid && !loading
      : mode === 'signin'
        ? isEmailValid && hasMinPassword && !loading
        : isEmailValid &&
          name.trim().length > 1 &&
          hasMinPassword &&
          confirmPassword.length >= 8 &&
          password === confirmPassword &&
          !loading;

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Email is required.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        toast.error('Display name is required.');
        return;
      }
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
      await signUpWithEmail(email.trim(), password, name.trim());
      return;
    }

    if (mode === 'signin') {
      if (!password) {
        toast.error('Password is required.');
        return;
      }
      await signInWithEmail(email.trim(), password);
      return;
    }

    await sendPasswordResetEmail(email.trim());
  };

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated || user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-3 py-6 transition-colors duration-300 sm:px-4 dark:bg-slate-950">
      <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/5" />
      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/5" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:bg-slate-800 sm:right-6 sm:top-6"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
      </button>

      <div className="z-10 w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 select-none items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-2xl font-extrabold text-white shadow-lg shadow-indigo-500/25 animate-pulse-subtle">
            M
          </div>
          <h1 className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent dark:from-white dark:via-indigo-100 dark:to-slate-200">
            Welcome to My Space
          </h1>
          <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400">
            Sign in to continue your workspace flow.
          </p>
        </div>

        <div className="glass-panel relative overflow-hidden rounded-3xl border border-slate-200/50 p-5 shadow-premium sm:p-8 dark:border-slate-800/40">
          <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-100/70 p-1 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => handleModeSwitch('signin')}
              className={cn(
                'rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all',
                mode === 'signin'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('signup')}
              className={cn(
                'rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all',
                mode === 'signup'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('forgot')}
              className={cn(
                'rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-all',
                mode === 'forgot'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              Recover
            </button>
          </div>

          <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Display name"
                className="w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800/40 dark:bg-slate-950/40 dark:text-white"
              />
            )}

            <input
              type="email"
              value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
              placeholder="Email address"
              className="w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800/40 dark:bg-slate-950/40 dark:text-white"
            />
            {emailTouched && email.length > 0 && !isEmailValid && (
              <p className="text-[11px] font-semibold text-rose-500">Enter a valid email address.</p>
            )}

            {mode !== 'forgot' && (
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800/40 dark:bg-slate-950/40 dark:text-white"
              />
            )}
            {mode !== 'forgot' && password.length > 0 && password.length < 6 && (
              <p className="text-[11px] font-semibold text-rose-500">Password should be minimum 6 characters.</p>
            )}

            {mode === 'signup' && (
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800/40 dark:bg-slate-950/40 dark:text-white"
              />
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-indigo-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : mode === 'signup' ? (
                <UserPlus className="h-4.5 w-4.5" />
              ) : mode === 'forgot' ? (
                <Mail className="h-4.5 w-4.5" />
              ) : (
                <KeyRound className="h-4.5 w-4.5" />
              )}
              <span>
                {mode === 'signup' && 'Sign Up'}
                {mode === 'signin' && 'Sign In'}
                {mode === 'forgot' && 'Send Reset Email'}
              </span>
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200/70 dark:bg-slate-800/40" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200/70 dark:bg-slate-800/40" />
          </div>

          <button
            onClick={() => signInWithGoogle()}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={loading}
            className={cn(
              'relative mb-2 flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-premium-hover dark:bg-white dark:text-slate-950',
              loading && 'pointer-events-none opacity-50'
            )}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continue with Google</span>
            <ArrowRight className={cn('h-4 w-4 transition-transform duration-300', isHovered ? 'translate-x-1' : '')} />
          </button>

          <button
            onClick={() => signInAsGuest()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800/40 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 disabled:opacity-60"
          >
            <UserRoundX className="h-4.5 w-4.5" />
            <span>Continue as Guest</span>
          </button>
        </div>
      </div>
    </div>
  );
};

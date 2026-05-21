import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Layers } from 'lucide-react';
import { cn } from '../utils/cn';

export const Login: React.FC = () => {
  const { user, signInWithGoogle, loading, checkSession } = useAuthStore();
  const [isHovered, setIsHovered] = useState(false);

  // Synchronize authentication session state on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // If already logged in, navigate straight to the dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300 overflow-hidden">
      {/* Decorative Gradient Background Blobs */}
      <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-3xl" />

      {/* Grid Canvas Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="z-10 w-full max-w-md">
        {/* Branding header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25 text-white font-extrabold text-2xl mb-4 select-none animate-pulse-subtle">
            M
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-100 dark:to-slate-200 bg-clip-text text-transparent">
            Welcome to My Space
          </h1>
          <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400">
            Your premium unified workspace for life, tasks, and text.
          </p>
        </div>

        {/* Authenticate Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-premium border border-slate-200/50 dark:border-slate-800/40 relative overflow-hidden">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
            Secure Authorization
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
            Get started immediately. Real Supabase OAuth and sandbox modes are fully synchronized.
          </p>

          <button
            onClick={() => signInWithGoogle()}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={loading}
            className={cn(
              "relative flex w-full items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold text-sm shadow-md hover:shadow-premium-hover transition-all duration-300 disabled:opacity-50 overflow-hidden cursor-pointer",
              loading && "pointer-events-none"
            )}
          >
            {/* Beautiful shiny overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />

            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    isHovered ? "translate-x-1" : ""
                  )}
                />
              </>
            )}
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/40 dark:bg-slate-900/20 border border-slate-200/20 dark:border-slate-800/10">
            <Zap className="h-4.5 w-4.5 text-indigo-500 mb-1.5" />
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Blazing Fast</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">Optimized state stores</span>
          </div>
          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/40 dark:bg-slate-900/20 border border-slate-200/20 dark:border-slate-800/10">
            <Layers className="h-4.5 w-4.5 text-blue-500 mb-1.5" />
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Notion Style</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">TipTap block rich texts</span>
          </div>
          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/40 dark:bg-slate-900/20 border border-slate-200/20 dark:border-slate-800/10">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 mb-1.5" />
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Secure Sync</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">Row Level Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};

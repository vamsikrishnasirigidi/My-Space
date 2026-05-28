import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { initialized, loading, user, initializeAuth, updatePassword } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initializeAuth();
    }
  }, [initializeAuth, initialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setUpdating(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate('/'), 1200);
    } catch {
      // Toast already handled by store.
    } finally {
      setUpdating(false);
    }
  };

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-slate-950">
      <div className="glass-panel z-10 w-full max-w-md rounded-3xl border border-slate-200/50 p-8 shadow-premium dark:border-slate-800/40">
        <h2 className="mb-2 text-xl font-extrabold text-slate-800 dark:text-slate-100">Reset Password</h2>
        <p className="mb-6 text-xs text-slate-400 dark:text-slate-500">
          Set a new secure password for your account.
        </p>

        {done ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-200/40 bg-emerald-50/40 px-4 py-6 text-center dark:border-emerald-900/30 dark:bg-emerald-950/20">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Password updated successfully
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800/40 dark:bg-slate-950/40 dark:text-white"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800/40 dark:bg-slate-950/40 dark:text-white"
            />
            <button
              type="submit"
              disabled={updating || loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-indigo-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updating ? (
                <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <KeyRound className="h-4.5 w-4.5" />
              )}
              <span>{updating ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

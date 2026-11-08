import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Mail, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import { DocMindLogo } from './DocMindLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  pendingPrompt?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pendingPrompt,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter your credentials');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success('Welcome back!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'Invalid username or password';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error('Please complete all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      await login(username.trim(), password);
      toast.success('Account created successfully!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'Registration failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-[420px] bg-white dark:bg-[#121217] border border-[#e5e5e5] dark:border-white/[0.08] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-5 sm:p-6 text-left"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <DocMindLogo size={28} className="rounded-xl shadow-xs" />
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-[#171717] dark:text-[#f4f4f5] tracking-tight">
                  {mode === 'login' ? 'Sign in to continue' : 'Create an account'}
                </h2>
                <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3]">
                  {mode === 'login' ? 'Log in to start getting grounded answers.' : 'Get started with DocMind in seconds.'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close"
              className="size-7 rounded-lg flex items-center justify-center text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] hover:bg-[#f5f5f5] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Pending Question Preview Callout */}
          {pendingPrompt && (
            <div className="mb-4 p-3 rounded-xl bg-[#fafafa] dark:bg-white/[0.03] border border-[#e5e5e5] dark:border-white/[0.08] text-left">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-medium text-[#171717] dark:text-[#f4f4f5] flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#171717] dark:bg-white" />
                  Queued question
                </span>
                <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">Auto-runs after sign in</span>
              </div>
              <p className="text-xs text-[#525252] dark:text-[#d4d4d8] font-normal line-clamp-2 leading-relaxed bg-white dark:bg-[#18181f] px-2.5 py-1.5 rounded-lg border border-[#e5e5e5]/80 dark:border-white/[0.06]">
                "{pendingPrompt}"
              </p>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-[#f5f5f5] dark:bg-white/[0.06] p-0.5 rounded-xl mb-4 border border-[#e5e5e5]/80 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer text-center',
                mode === 'login'
                  ? 'bg-white dark:bg-[#202026] text-[#171717] dark:text-[#f4f4f5] shadow-2xs'
                  : 'text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5]'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={cn(
                'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer text-center',
                mode === 'register'
                  ? 'bg-white dark:bg-[#202026] text-[#171717] dark:text-[#f4f4f5] shadow-2xs'
                  : 'text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5]'
              )}
            >
              Create Account
            </button>
          </div>

          {/* Login Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#a3a3a3]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-white dark:bg-[#18181f] border border-[#e5e5e5] dark:border-white/[0.08] text-xs text-[#171717] dark:text-[#f4f4f5] placeholder-[#a3a3a3] outline-none focus:border-neutral-400 dark:focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#a3a3a3]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-9 pl-9 pr-9 rounded-xl bg-white dark:bg-[#18181f] border border-[#e5e5e5] dark:border-white/[0.08] text-xs text-[#171717] dark:text-[#f4f4f5] placeholder-[#a3a3a3] outline-none focus:border-neutral-400 dark:focus:border-white/20 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-1.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-xs font-medium bg-[#171717] hover:bg-[#303030] active:bg-[#404040] text-white transition-colors duration-150 ease-in-out cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-white" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>{pendingPrompt ? 'Sign in & get answer' : 'Continue'}</span>
                      <ArrowRight className="size-3.5 text-white" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#a3a3a3]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-white dark:bg-[#18181f] border border-[#e5e5e5] dark:border-white/[0.08] text-xs text-[#171717] dark:text-[#f4f4f5] placeholder-[#a3a3a3] outline-none focus:border-neutral-400 dark:focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#a3a3a3]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-white dark:bg-[#18181f] border border-[#e5e5e5] dark:border-white/[0.08] text-xs text-[#171717] dark:text-[#f4f4f5] placeholder-[#a3a3a3] outline-none focus:border-neutral-400 dark:focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#a3a3a3]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-9 pl-9 pr-9 rounded-xl bg-white dark:bg-[#18181f] border border-[#e5e5e5] dark:border-white/[0.08] text-xs text-[#171717] dark:text-[#f4f4f5] placeholder-[#a3a3a3] outline-none focus:border-neutral-400 dark:focus:border-white/20 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-1.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-xs font-medium bg-[#171717] hover:bg-[#303030] active:bg-[#404040] text-white transition-colors duration-150 ease-in-out cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-white" />
                      <span>Creating account…</span>
                    </>
                  ) : (
                    <>
                      <span>{pendingPrompt ? 'Create account & get answer' : 'Sign up'}</span>
                      <ArrowRight className="size-3.5 text-white" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


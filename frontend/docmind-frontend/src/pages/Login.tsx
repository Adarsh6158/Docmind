import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import ThemeToggle from '../components/ThemeToggle';
import { DocMindLogo } from '../components/DocMindLogo';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ username: false, password: false });

  const navigate = useNavigate();
  const { login, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  const usernameError = touched.username && !username.trim() ? 'Username is required' : '';
  const passwordError = touched.password && !password.trim() ? 'Password is required' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });

    if (!username.trim() || !password.trim()) {
      toast.error('Please enter your credentials');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success('Welcome back');
      navigate('/', { replace: true });
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

  return (
    <div className="min-h-dvh bg-white dark:bg-[#0c0c0e] text-[#171717] dark:text-[#f4f4f5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-neutral-200 dark:selection:bg-neutral-800 transition-colors duration-150">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Subtle architectural background grid */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" 
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="sm:mx-auto sm:w-full sm:max-w-[400px] relative z-10"
      >
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8 text-center">
          <DocMindLogo size={44} className="rounded-2xl shadow-xs mb-4" />
          <h1 className="text-xl font-semibold tracking-tight text-[#171717] dark:text-[#f4f4f5] text-balance">
            Sign in to DocMind
          </h1>
          <p className="mt-1 text-xs text-[#737373] dark:text-[#a3a3a3] text-pretty">
            Enterprise document intelligence and grounded knowledge assistant
          </p>
        </div>

        {/* Auth card */}
        <div className="bg-white dark:bg-[#141416] border border-[#e5e5e5] dark:border-white/[0.08] shadow-xl dark:shadow-2xl dark:shadow-black/70 rounded-2xl p-6 sm:p-8">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="login-username" className="block text-xs font-medium text-[#171717] dark:text-[#f4f4f5] mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#a3a3a3]">
                  <User className="size-4" strokeWidth={1.75} />
                </div>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className={cn(
                    'block w-full pl-9 pr-3 py-2.5 sm:py-2 bg-white dark:bg-[#101013] border rounded-xl text-[#171717] dark:text-[#f4f4f5] placeholder-[#a3a3a3] text-base sm:text-sm transition-colors font-sans',
                    'focus:outline-none focus:border-[#151515] dark:focus:border-white/30',
                    usernameError ? 'border-rose-500/60' : 'border-[#e5e5e5] dark:border-white/[0.08]'
                  )}
                />
              </div>
              {usernameError && (
                <p className="text-[11px] text-rose-500 mt-1.5 pl-0.5">{usernameError}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-medium text-[#171717] dark:text-[#f4f4f5]">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#a3a3a3]">
                  <Lock className="size-4" strokeWidth={1.75} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'block w-full pl-9 pr-9 py-2.5 sm:py-2 bg-white dark:bg-[#101013] border rounded-xl text-[#171717] dark:text-[#f4f4f5] placeholder-[#a3a3a3] text-base sm:text-sm transition-colors font-sans',
                    'focus:outline-none focus:border-[#151515] dark:focus:border-white/30',
                    passwordError ? 'border-rose-500/60' : 'border-[#e5e5e5] dark:border-white/[0.08]'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#f4f4f5] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" strokeWidth={1.75} /> : <Eye className="size-4" strokeWidth={1.75} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-rose-500 mt-1.5 pl-0.5">{passwordError}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full flex justify-center items-center gap-2 py-2 px-4 rounded-xl text-sm font-medium',
                  'bg-[#151515] text-white hover:bg-black dark:bg-[#ffffff] dark:text-[#151515] dark:hover:bg-neutral-100 active:scale-[0.98] transition-all cursor-pointer shadow-2xs',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#e5e5e5] dark:border-white/[0.08] flex items-center justify-between text-xs text-[#737373] dark:text-[#a3a3a3]">
            <span>Don't have an account?</span>
            <Link
              to="/register"
              className="text-[#171717] dark:text-[#f4f4f5] hover:underline font-medium underline-offset-4 transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>

        {/* Security / System indicator */}
        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-[#a3a3a3]">
          <ShieldCheck className="size-3.5" />
          <span>Enterprise security and data encryption</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

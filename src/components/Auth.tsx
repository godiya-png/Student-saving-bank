/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (token: string, user: any) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'verify';

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'NGN' | 'USD' | 'EUR'>('NGN');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification states
  const [verificationCode, setVerificationCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        
        if (rememberMe) {
          localStorage.setItem('edusave_token', data.token);
          localStorage.setItem('edusave_user', JSON.stringify(data.user));
        }
        onAuthSuccess(data.token, data.user);
      } else if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, currency })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');

        setSuccessMsg('Account created successfully! We sent you an activation link.');
        // Go to verification step
        setMode('verify');
      } else if (mode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        setSuccessMsg(data.message);
      } else if (mode === 'verify') {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');
        setSuccessMsg('Email verified successfully! You can now log in.');
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Skip auth with direct demo login
  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@edusave.ng', password: 'password123' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Demo login failed');
      
      localStorage.setItem('edusave_token', data.token);
      localStorage.setItem('edusave_user', JSON.stringify(data.user));
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError('Could not connect to database server. Using offline local mode instead.');
      // Create local offline fallback
      const offlineUser = {
        id: 'user_offline_student',
        name: 'Offline Student',
        email: 'offline@edusave.ng',
        currency: 'NGN' as const,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('edusave_token', 'local_offline_token_2026');
      localStorage.setItem('edusave_user', JSON.stringify(offlineUser));
      onAuthSuccess('local_offline_token_2026', offlineUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth_container" className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 py-12 transition-colors duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500"></div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans">
            EduSave
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Smart Savings Companion for Students
          </p>
        </div>

        {/* Notification banners */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900"
          >
            {error}
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900"
          >
            {successMsg}
          </motion.div>
        )}

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tunde Alabi"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">School / Personal Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@edusave.ng"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {mode === 'verify' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Enter Verification Code</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter any 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">We simulated sending an email check. You can enter any code here to complete activation!</p>
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="NGN">Nigerian Naira (₦)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="remember_me" className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                Remember my workspace session
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-emerald-500/15"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === 'login' && 'Access Workspace'}
                {mode === 'signup' && 'Create Free Account'}
                {mode === 'forgot' && 'Send Reset Instructions'}
                {mode === 'verify' && 'Complete Activation'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Mode Toggle footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700/50 text-center">
          {mode === 'login' && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              New to EduSave?{' '}
              <button onClick={() => setMode('signup')} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                Create Account
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                Sign In
              </button>
            </p>
          )}

          {(mode === 'forgot' || mode === 'verify') && (
            <button onClick={() => setMode('login')} className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Back to Sign In
            </button>
          )}
        </div>

        {/* Demo Fast Track */}
        <div className="mt-4 text-center">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
            <span className="flex-shrink mx-3 text-[10px] text-gray-400 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
          </div>
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium py-1.5 px-3 rounded-lg border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 inline-flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Fast-Track Demo Login
          </button>
          <p className="text-[10px] text-gray-400 mt-1">Logs in instantly with rich simulated data of student "Tunde"</p>
        </div>
      </motion.div>
    </div>
  );
}

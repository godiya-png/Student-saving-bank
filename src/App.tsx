/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, Target, Award, Sparkles, BookOpen, 
  Calculator as CalcIcon, LogOut, Sun, Moon, User, 
  Bell, RefreshCw, AlertCircle, Menu, X, Landmark, Compass
} from 'lucide-react';

import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Goals from './components/Goals';
import BudgetPlanner from './components/BudgetPlanner';
import Challenges from './components/Challenges';
import Insights from './components/Insights';
import Calculator from './components/Calculator';
import Motivation from './components/Motivation';
import LinkBankAccount from './components/LinkBankAccount';
import { DashboardData, SavingsGoal, Budget } from './types';

type ActiveTab = 'dashboard' | 'goals' | 'budget' | 'challenges' | 'insights' | 'calculator' | 'motivation';

export default function App() {
  // Authentication states
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Core global dashboard states
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UI Theme & View states
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'profile' | 'bank' | 'logout'>('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profile Edit fields
  const [editName, setEditName] = useState('');
  const [editCurrency, setEditCurrency] = useState<'NGN' | 'USD' | 'EUR'>('NGN');

  // Load token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('edusave_token');
    const savedUser = localStorage.getItem('edusave_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    // Read initial theme preference
    const savedTheme = localStorage.getItem('edusave_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = (savedTheme as 'light' | 'dark') || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  // Update theme class on document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('edusave_theme', theme);
  }, [theme]);

  // Synchronize dashboard portfolio data with backend Express APIs
  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to sync workspace');
      setData(resData);
    } catch (err: any) {
      setError('Connection backup mode. Syncing with offline local state cache.');
      // Local storage fallback for seamless offline resilience
      const fallbackLocalData = getLocalFallbackCache();
      setData(fallbackLocalData);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize on login or token changes
  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Local Offline Storage Fallbacks
  const getLocalFallbackCache = (): DashboardData => {
    const cache = localStorage.getItem(`edusave_cache_${user?.id}`);
    if (cache) return JSON.parse(cache);

    // Initial Empty template
    const emptyTemplate: DashboardData = {
      balance: 10000,
      monthlyGoal: 15000,
      todaySavings: 2000,
      weeklySavings: 5000,
      totalDeposits: 12000,
      streak: 3,
      recentTransactions: [
        { id: 'offline_1', userId: user?.id || '', amount: 2000, type: 'saving', category: 'Pocket Money', date: new Date().toISOString().split('T')[0], note: 'Saved some coins', createdAt: new Date().toISOString() }
      ],
      goals: [
        { id: 'offline_g1', userId: user?.id || '', name: 'Demo Tuition Prep', targetAmount: 100000, currentAmount: 30000, deadline: '2026-12-31', status: 'active', category: 'Tuition Fees', createdAt: new Date().toISOString() }
      ],
      budget: { userId: user?.id || '', allowance: 30000, income: 0, pocketMoney: 10000, scholarship: 0, sideHustle: 0, needsPercent: 50, wantsPercent: 30, savingsPercent: 20 },
      challenges: {
        available: [
          { id: 'ch_daily_100', name: 'Save ₦100 Every Day', description: 'Save N100 daily for a week.', targetAmount: 700, durationDays: 7, badgeId: 'badge_30_day', category: 'Daily' }
        ],
        joined: []
      },
      badges: [
        { id: 'badge_first_save', name: 'First Save', description: 'Deposited first savings.', icon: '🥉', unlockedAt: new Date().toISOString() }
      ],
      notifications: [
        { id: 'notif_offline_1', userId: user?.id || '', message: 'Offline cache activated. All transactions saved locally.', type: 'info', date: new Date().toISOString(), read: false }
      ]
    };
    return emptyTemplate;
  };

  const updateLocalFallbackCache = (newData: DashboardData) => {
    localStorage.setItem(`edusave_cache_${user?.id}`, JSON.stringify(newData));
    setData(newData);
  };

  const handleAuthSuccess = (newToken: string, authenticatedUser: any) => {
    setToken(newToken);
    setUser(authenticatedUser);
    setEditName(authenticatedUser.name);
    setEditCurrency(authenticatedUser.currency || 'NGN');
  };

  const handleLogout = () => {
    localStorage.removeItem('edusave_token');
    localStorage.removeItem('edusave_user');
    setToken(null);
    setUser(null);
    setData(null);
    setActiveTab('dashboard');
  };

  // API OPERATIONS

  // Create Transaction
  const addTransaction = async (
    amount: number,
    type: 'saving' | 'expense',
    category: string,
    date: string,
    note: string,
    allocateGoalId?: string
  ) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, type, category, date, note, allocateToGoalId: allocateGoalId })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to log transaction');
      
      // Successfully created, fetch fresh data
      fetchDashboardData();
    } catch (err) {
      console.warn("Offline API execution fallback triggered.", err);
      if (!data) return;
      // Local sync
      const mockTx = {
        id: `offline_tx_${Date.now()}`,
        userId: user.id,
        amount,
        type,
        category,
        date,
        note,
        createdAt: new Date().toISOString()
      };
      const updatedTx = [mockTx, ...data.recentTransactions];
      
      let updatedGoals = [...data.goals];
      if (type === 'saving' && allocateGoalId) {
        updatedGoals = updatedGoals.map(g => {
          if (g.id === allocateGoalId) {
            return { ...g, currentAmount: g.currentAmount + amount };
          }
          return g;
        });
      }

      const balanceModifier = type === 'saving' ? amount : -amount;
      const updatedData: DashboardData = {
        ...data,
        balance: Math.max(0, data.balance + balanceModifier),
        totalDeposits: data.totalDeposits + (type === 'saving' ? amount : 0),
        recentTransactions: updatedTx,
        goals: updatedGoals
      };
      updateLocalFallbackCache(updatedData);
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to delete transaction');
      
      fetchDashboardData();
    } catch (err) {
      console.warn("Offline API delete fallback.", err);
      if (!data) return;
      const index = data.recentTransactions.findIndex(t => t.id === id);
      if (index === -1) return;
      const target = data.recentTransactions[index];
      const balanceModifier = target.type === 'saving' ? -target.amount : target.amount;

      const updatedData: DashboardData = {
        ...data,
        balance: Math.max(0, data.balance + balanceModifier),
        recentTransactions: data.recentTransactions.filter(t => t.id !== id)
      };
      updateLocalFallbackCache(updatedData);
    }
  };

  // Add Savings Goal
  const addGoal = async (name: string, targetAmount: number, deadline: string, category: string) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, targetAmount, deadline, category })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create goal');
      
      fetchDashboardData();
    } catch (err) {
      console.warn("Offline API goal create fallback.", err);
      if (!data) return;
      const mockGoal: SavingsGoal = {
        id: `offline_goal_${Date.now()}`,
        userId: user.id,
        name,
        targetAmount,
        currentAmount: 0,
        deadline,
        status: 'active',
        category,
        createdAt: new Date().toISOString()
      };
      const updatedData: DashboardData = {
        ...data,
        goals: [...data.goals, mockGoal]
      };
      updateLocalFallbackCache(updatedData);
    }
  };

  // Update Savings Goal details
  const updateGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update goal');
      
      fetchDashboardData();
    } catch (err) {
      console.warn("Offline API goal update fallback.", err);
      if (!data) return;
      const updatedGoals = data.goals.map(g => {
        if (g.id === id) {
          return { ...g, ...updates } as SavingsGoal;
        }
        return g;
      });
      const updatedData: DashboardData = {
        ...data,
        goals: updatedGoals
      };
      updateLocalFallbackCache(updatedData);
    }
  };

  // Delete Savings Goal
  const deleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to delete goal');
      
      fetchDashboardData();
    } catch (err) {
      console.warn("Offline API goal delete fallback.", err);
      if (!data) return;
      const updatedData: DashboardData = {
        ...data,
        goals: data.goals.filter(g => g.id !== id)
      };
      updateLocalFallbackCache(updatedData);
    }
  };

  // Update Smart Budget
  const updateBudget = async (updates: Partial<Budget>) => {
    try {
      const res = await fetch('/api/budget', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update budget');
      
      fetchDashboardData();
    } catch (err) {
      console.warn("Offline API budget update fallback.", err);
      if (!data) return;
      const updatedData: DashboardData = {
        ...data,
        budget: { ...data.budget, ...updates } as Budget
      };
      updateLocalFallbackCache(updatedData);
    }
  };

  // Join Saving Challenge
  const joinChallenge = async (challengeId: string) => {
    try {
      const res = await fetch('/api/challenges/join', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ challengeId })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to join challenge');
      
      fetchDashboardData();
    } catch (err) {
      console.warn("Offline API challenge join fallback.", err);
      if (!data) return;
      const mockUserChallenge = {
        userId: user.id,
        challengeId,
        startDate: new Date().toISOString().split('T')[0],
        currentAmount: 0,
        status: 'active' as const
      };
      const updatedData: DashboardData = {
        ...data,
        challenges: {
          ...data.challenges,
          joined: [...data.challenges.joined, mockUserChallenge]
        }
      };
      updateLocalFallbackCache(updatedData);
    }
  };

  // Update Profile on Server
  const saveUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName, currency: editCurrency })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Profile update failed');

      localStorage.setItem('edusave_user', JSON.stringify(resData.user));
      setUser(resData.user);
      setShowProfileModal(false);
      fetchDashboardData();
    } catch (err) {
      console.warn("Offline profile edit.", err);
      const updatedUser = { ...user, name: editName, currency: editCurrency };
      localStorage.setItem('edusave_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setShowProfileModal(false);
    }
  };

  // Update Bank Details on Server
  const handleUpdateBankDetails = async (bankName: string, accountNumber: string, accountName: string, isLinked: boolean) => {
    try {
      const bankDetails = isLinked ? { bankName, accountNumber, accountName, isLinked: true } : null;
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bankDetails })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update bank details');

      localStorage.setItem('edusave_user', JSON.stringify(resData.user));
      setUser(resData.user);
      fetchDashboardData();
    } catch (err) {
      console.warn("Offline bank details save fallback.", err);
      const updatedUser = { 
        ...user, 
        bankDetails: isLinked ? { bankName, accountNumber, accountName, isLinked: true } : undefined 
      };
      localStorage.setItem('edusave_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  // Mark all notifications as read
  const markNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications/read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchDashboardData();
    } catch (err) {
      if (!data) return;
      const updatedNotifs = data.notifications.map(n => ({ ...n, read: true }));
      updateLocalFallbackCache({ ...data, notifications: updatedNotifs });
    }
  };

  // Helper values
  const getCurrencySymbol = () => {
    switch (user?.currency || 'NGN') {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return '₦';
    }
  };

  // Calculate actual spending metrics for budget planner comparison
  const calculateActualSpend = () => {
    if (!data) return { needs: 0, wants: 0, savings: 0 };
    
    // Categorize actual spend from transaction logs
    const needsCategories = ['Tuition Fees', 'Hostel Rent', 'Textbooks', 'School Materials', 'Health', 'Transport'];
    const wantsCategories = ['Entertainment', 'Airtime', 'Data', 'Clothes', 'Food'];

    let needs = 0;
    let wants = 0;
    let savings = data.totalDeposits;

    data.recentTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (needsCategories.includes(t.category)) {
          needs += t.amount;
        } else if (wantsCategories.includes(t.category)) {
          wants += t.amount;
        } else {
          needs += t.amount; // Miscellaneous default
        }
      });

    return { needs, wants, savings };
  };

  // Render main sub-view
  const renderSubView = () => {
    if (!data) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
          <p className="text-xs text-gray-400">Loading student workspace settings...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            data={data}
            user={user}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
            onRefresh={fetchDashboardData}
            currencySymbol={getCurrencySymbol()}
            onUpdateBankDetails={handleUpdateBankDetails}
          />
        );
      case 'goals':
        return (
          <Goals 
            goals={data.goals}
            weeklySavings={data.weeklySavings}
            onAddGoal={addGoal}
            onUpdateGoal={updateGoal}
            onDeleteGoal={deleteGoal}
            currencySymbol={getCurrencySymbol()}
          />
        );
      case 'budget':
        return (
          <BudgetPlanner 
            budget={data.budget}
            actualSpend={calculateActualSpend()}
            onUpdateBudget={updateBudget}
            currencySymbol={getCurrencySymbol()}
          />
        );
      case 'challenges':
        return (
          <Challenges 
            data={data}
            onJoinChallenge={joinChallenge}
            currencySymbol={getCurrencySymbol()}
          />
        );
      case 'insights':
        return (
          <Insights 
            data={data}
            onRefresh={fetchDashboardData}
            currencySymbol={getCurrencySymbol()}
          />
        );
      case 'calculator':
        return <Calculator currencySymbol={getCurrencySymbol()} />;
      case 'motivation':
        return <Motivation />;
      default:
        return null;
    }
  };

  // Return Auth screen if not logged in
  if (!token || !user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const unreadNotificationsCount = data?.notifications.filter(n => !n.read).length || 0;

  return (
    <div id="edusave_app_workspace" className="min-h-screen bg-gray-50/50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 font-sans flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700/60 p-5 shrink-0 z-10 transition-colors duration-300">
        <div className="space-y-6">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5 px-2">
            <span className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h1 className="font-extrabold text-sm text-gray-950 dark:text-white leading-none tracking-tight">EduSave</h1>
              <span className="text-[9px] text-gray-400 mt-0.5 block font-semibold">Student Wallet Coach</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-semibold">
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/30 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Compass className="w-4.5 h-4.5" />
              Overview Dashboard
            </button>

            <button 
              onClick={() => { setActiveTab('goals'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'goals' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/30 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Target className="w-4.5 h-4.5" />
              Savings Milestones
            </button>

            <button 
              onClick={() => { setActiveTab('budget'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'budget' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/30 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Landmark className="w-4.5 h-4.5" />
              Smart Budget Planner
            </button>

            <button 
              onClick={() => { setActiveTab('challenges'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'challenges' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/30 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Award className="w-4.5 h-4.5" />
              Challenges & Badges
            </button>

            <button 
              onClick={() => { setActiveTab('insights'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'insights' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/30 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4.5 h-4.5" />
              AI Coach & Insights
            </button>

            <button 
              onClick={() => { setActiveTab('calculator'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'calculator' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/30 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <CalcIcon className="w-4.5 h-4.5" />
              Savings Calculator
            </button>

            <button 
              onClick={() => { setActiveTab('motivation'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'motivation' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/30 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-4.5 h-4.5" />
              Motivation & Articles
            </button>
          </nav>

        </div>

        {/* User profile details at bottom */}
        <div className="space-y-4 border-t border-gray-100 dark:border-slate-700/60 pt-4 text-xs font-semibold">
          <div 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 p-1.5 hover:bg-gray-50 dark:hover:bg-slate-700/40 rounded-xl cursor-pointer transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="space-y-0.5">
              <h4 className="text-gray-900 dark:text-white leading-tight font-bold">{user.name}</h4>
              <span className="text-[10px] text-gray-400 block font-normal truncate max-w-[140px]">{user.email}</span>
            </div>
          </div>

          {/* Theme & Logout toggles */}
          <div className="flex items-center justify-between gap-2 px-1">
            <button 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[10px]">Logout</span>
            </button>
          </div>
        </div>

      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700/60 px-4 py-3 flex items-center justify-between sticky top-0 z-20 transition-all duration-300">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Sparkles className="w-4.5 h-4.5" />
          </span>
          <h1 className="font-extrabold text-xs text-gray-900 dark:text-white tracking-tight">EduSave</h1>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={() => {
              if (unreadNotificationsCount > 0) markNotificationsAsRead();
              setShowNotificationDrawer(true);
            }}
            className="p-1.5 text-gray-400 hover:text-emerald-500 rounded-lg relative"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-gray-400 hover:text-emerald-500 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700/60 absolute top-12 left-0 w-full z-20 shadow-lg px-4 py-4 space-y-3 font-semibold text-xs"
          >
            <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-600 dark:bg-slate-700/50 dark:text-white' : ''}`}>Overview Dashboard</button>
            <button onClick={() => { setActiveTab('goals'); setIsMobileMenuOpen(false); }} className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2 ${activeTab === 'goals' ? 'bg-emerald-50 text-emerald-600 dark:bg-slate-700/50 dark:text-white' : ''}`}>Savings Milestones</button>
            <button onClick={() => { setActiveTab('budget'); setIsMobileMenuOpen(false); }} className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2 ${activeTab === 'budget' ? 'bg-emerald-50 text-emerald-600 dark:bg-slate-700/50 dark:text-white' : ''}`}>Smart Budget Planner</button>
            <button onClick={() => { setActiveTab('challenges'); setIsMobileMenuOpen(false); }} className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2 ${activeTab === 'challenges' ? 'bg-emerald-50 text-emerald-600 dark:bg-slate-700/50 dark:text-white' : ''}`}>Challenges & Badges</button>
            <button onClick={() => { setActiveTab('insights'); setIsMobileMenuOpen(false); }} className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2 ${activeTab === 'insights' ? 'bg-emerald-50 text-emerald-600 dark:bg-slate-700/50 dark:text-white' : ''}`}>AI Coach & Insights</button>
            <button onClick={() => { setActiveTab('calculator'); setIsMobileMenuOpen(false); }} className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2 ${activeTab === 'calculator' ? 'bg-emerald-50 text-emerald-600 dark:bg-slate-700/50 dark:text-white' : ''}`}>Savings Calculator</button>
            <button onClick={() => { setActiveTab('motivation'); setIsMobileMenuOpen(false); }} className={`w-full text-left p-2.5 rounded-lg flex items-center gap-2 ${activeTab === 'motivation' ? 'bg-emerald-50 text-emerald-600 dark:bg-slate-700/50 dark:text-white' : ''}`}>Motivation Hub</button>
            <div className="border-t border-gray-100 dark:border-slate-700/50 pt-2.5 flex justify-between items-center text-gray-500">
              <span onClick={() => { setShowProfileModal(true); setIsMobileMenuOpen(false); }} className="cursor-pointer">Edit Profile</span>
              <span onClick={handleLogout} className="text-rose-500 cursor-pointer flex items-center gap-1"><LogOut className="w-4 h-4" />Logout</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* Top Desktop Action Row */}
        <div className="hidden md:flex items-center justify-end gap-3 self-end text-xs font-semibold z-10">
          
          {/* Notifications Trigger */}
          <button 
            onClick={() => {
              if (unreadNotificationsCount > 0) markNotificationsAsRead();
              setShowNotificationDrawer(true);
            }}
            className="p-2 text-gray-400 hover:text-emerald-500 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 rounded-xl transition-all relative cursor-pointer"
            title="System notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </button>

          {/* Quick Profile display */}
          <div 
            onClick={() => setShowProfileModal(true)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-[10px]">
              {user.name.charAt(0)}
            </div>
            <span className="text-gray-700 dark:text-gray-200">{user.name}</span>
          </div>

        </div>

        {/* Dynamic sub-view layout injection */}
        {renderSubView()}

      </main>

      {/* Sidebar Overlay: Notifications Drawer */}
      <AnimatePresence>
        {showNotificationDrawer && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm h-full p-6 shadow-2xl flex flex-col justify-between border-l border-gray-100 dark:border-slate-700/60"
            >
              <div className="space-y-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/60 pb-3">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Bell className="w-4.5 h-4.5 text-emerald-500" />
                    System Notifications
                  </h3>
                  <button 
                    onClick={() => setShowNotificationDrawer(false)}
                    className="p-1 text-gray-400 hover:text-gray-500 rounded-md"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Notifications list */}
                <div className="space-y-3">
                  {data?.notifications && data.notifications.length > 0 ? (
                    data.notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          notif.type === 'success' 
                            ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                            : notif.type === 'warning'
                            ? 'bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
                            : 'bg-gray-50/50 border-gray-100 dark:bg-slate-900/50 dark:border-slate-700/50 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <p>{notif.message}</p>
                        <span className="text-[9px] text-gray-400 block mt-1.5">{notif.date.split('T')[0]}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-xs text-gray-400">No active notifications. Check back soon!</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowNotificationDrawer(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-bold text-xs py-2 rounded-xl transition-all text-center cursor-pointer mt-4"
              >
                Close Drawer
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal dialog: User Profile settings */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 dark:border-slate-700/80"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-slate-700/80">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-500" />
                Student Settings Center
              </h3>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-500 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            {/* Tab selection triggers */}
            <div className="flex border-b border-gray-100 dark:border-slate-700/60 mb-5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSettingsActiveTab('profile')}
                className={`flex-1 py-2 border-b-2 text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settingsActiveTab === 'profile'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Profile & Currency
              </button>
              <button
                type="button"
                onClick={() => setSettingsActiveTab('bank')}
                className={`flex-1 py-2 border-b-2 text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settingsActiveTab === 'bank'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                Student Bank Link
              </button>
              <button
                type="button"
                onClick={() => setSettingsActiveTab('logout')}
                className={`flex-1 py-2 border-b-2 text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  settingsActiveTab === 'logout'
                    ? 'border-rose-500 text-rose-500'
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                Session & Logout
              </button>
            </div>

            {/* Profile & Currency Tab Content */}
            {settingsActiveTab === 'profile' && (
              <form onSubmit={saveUserProfile} className="space-y-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Default Workspace Currency</label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold cursor-pointer"
                  >
                    <option value="NGN">Nigerian Naira (₦)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                  <p className="text-[9px] text-gray-400 font-normal mt-1 leading-normal">Changes are synced back to the server and will update your dashboard metrics dynamically.</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all text-center cursor-pointer shadow-sm shadow-emerald-600/15"
                >
                  Save Workspace Profile
                </button>
              </form>
            )}

            {/* Bank Link Tab Content */}
            {settingsActiveTab === 'bank' && (
              <div className="space-y-2">
                <LinkBankAccount 
                  user={user} 
                  onUpdateBankDetails={handleUpdateBankDetails} 
                />
              </div>
            )}

            {/* Session & Logout Tab Content */}
            {settingsActiveTab === 'logout' && (
              <div className="space-y-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <div className="bg-rose-50/20 dark:bg-rose-950/5 p-4 rounded-xl border border-rose-100/50 dark:border-rose-900/20 text-center space-y-3">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal font-normal">
                    You are signed in as <span className="font-bold text-gray-900 dark:text-white font-mono">{user.email}</span>. Your savings metrics and milestones are secured.
                  </p>
                  
                  <div className="text-[10px] text-left space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-800 font-semibold max-w-xs mx-auto">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Owner:</span>
                      <span className="text-gray-800 dark:text-white font-bold">{user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Currency Scope:</span>
                      <span className="text-gray-800 dark:text-white font-mono font-bold">{user.currency || 'NGN'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Registered Date:</span>
                      <span className="text-gray-800 dark:text-white font-mono font-bold">
                        {user.createdAt ? user.createdAt.split('T')[0] : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to log out of your Student Wallet session?')) {
                        handleLogout();
                      }
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/15"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log Out of Session
                  </button>
                  <p className="text-[9px] text-gray-400 text-center font-normal">
                    Logging out will safely clear local credentials. You can sign back in at any time.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}

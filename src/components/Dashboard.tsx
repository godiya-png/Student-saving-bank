/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Award, Zap, Sparkles, 
  Plus, Trash2, Calendar, Search, Filter, Download, 
  ArrowUpRight, ArrowDownRight, Wallet, CheckCircle, RefreshCw, Landmark
} from 'lucide-react';
import { DashboardData, Transaction } from '../types';

interface DashboardProps {
  data: DashboardData;
  user: any;
  onAddTransaction: (amount: number, type: 'saving' | 'expense', category: string, date: string, note: string, allocateGoalId?: string) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onRefresh: () => void;
  currencySymbol: string;
  onUpdateBankDetails: (bankName: string, accountNumber: string, accountName: string, isLinked: boolean) => Promise<void>;
}

const MOTIVATIONAL_QUOTES = [
  "Do not save what is left after spending, but spend what is left after saving. – Warren Buffett",
  "The secret of getting ahead is getting started. Make a ₦100 saving today!",
  "Small daily deposits create massive future opportunities. Every Naira counts!",
  "Financial discipline is choosing what you want most over what you want now.",
  "Your financial future is created by what you do today, not tomorrow.",
  "Being a student doesn't limit your wealth; it initiates your smart money habit!"
];

export default function Dashboard({ data, user, onAddTransaction, onDeleteTransaction, onRefresh, currencySymbol, onUpdateBankDetails }: DashboardProps) {
  // Quote selection based on day of week
  const quoteIndex = new Date().getDay() % MOTIVATIONAL_QUOTES.length;
  const quoteOfTheDay = MOTIVATIONAL_QUOTES[quoteIndex];

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'saving' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Transaction logging modal/drawer
  const [showLogModal, setShowLogModal] = useState(false);
  const [logAmount, setLogAmount] = useState('');
  const [logType, setLogType] = useState<'saving' | 'expense'>('saving');
  const [logCategory, setLogCategory] = useState('Food');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logNote, setLogNote] = useState('');
  const [logGoalId, setLogGoalId] = useState('');
  const [loading, setLoading] = useState(false);

  // Bank integration states
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankNameInput, setBankNameInput] = useState(user?.bankDetails?.bankName || 'GTBank');
  const [bankAccountInput, setBankAccountInput] = useState(user?.bankDetails?.accountNumber || '');
  const [bankHolderInput, setBankHolderInput] = useState(user?.bankDetails?.accountName || user?.name || '');
  const [bankSyncing, setBankSyncing] = useState(false);

  // Easy save states
  const [showEasySaveModal, setShowEasySaveModal] = useState(false);
  const [easySaveAmount, setEasySaveAmount] = useState('');
  const [easySaveGoalId, setEasySaveGoalId] = useState('');
  const [easySaving, setEasySaving] = useState(false);

  const handleOpenBankModal = () => {
    setBankNameInput(user?.bankDetails?.bankName || 'GTBank');
    setBankAccountInput(user?.bankDetails?.accountNumber || '');
    setBankHolderInput(user?.bankDetails?.accountName || user?.name || '');
    setShowBankModal(true);
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankNameInput || !bankAccountInput || !bankHolderInput) return;
    setBankSyncing(true);
    try {
      await onUpdateBankDetails(bankNameInput, bankAccountInput, bankHolderInput, true);
      setShowBankModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setBankSyncing(false);
    }
  };

  const handleUnlinkBank = async () => {
    if (window.confirm("Are you sure you want to unlink your bank account?")) {
      setBankSyncing(true);
      try {
        await onUpdateBankDetails('', '', '', false);
        setShowBankModal(false);
      } catch (err) {
        console.error(err);
      } finally {
        setBankSyncing(false);
      }
    }
  };

  const handleEasySaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(easySaveAmount);
    if (!easySaveAmount || isNaN(amountNum) || amountNum <= 0) return;
    setEasySaving(true);
    try {
      const bankName = user?.bankDetails?.bankName || 'Linked Bank';
      const acctEnd = user?.bankDetails?.accountNumber 
        ? ` (•••• ${user.bankDetails.accountNumber.slice(-4)})` 
        : '';
      const todayStr = new Date().toISOString().split('T')[0];
      
      await onAddTransaction(
        amountNum,
        'saving',
        'Pocket Money',
        todayStr,
        `Easy-Save Transfer from ${bankName}${acctEnd}`,
        easySaveGoalId || undefined
      );
      
      setEasySaveAmount('');
      setEasySaveGoalId('');
      setShowEasySaveModal(false);
    } catch (err) {
      console.error("Easy save failed", err);
    } finally {
      setEasySaving(false);
    }
  };

  // Quick categories
  const SAVING_CATEGORIES = ['Income', 'Scholarship', 'Pocket Money', 'Side Hustle', 'Miscellaneous'];
  const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Airtime', 'Data', 'Entertainment', 'School Materials', 'Clothes', 'Health', 'Miscellaneous'];

  const handleOpenLogModal = (type: 'saving' | 'expense') => {
    setLogType(type);
    setLogCategory(type === 'saving' ? 'Pocket Money' : 'Food');
    setShowLogModal(true);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logAmount || isNaN(Number(logAmount)) || Number(logAmount) <= 0) return;
    setLoading(true);
    try {
      await onAddTransaction(
        Number(logAmount),
        logType,
        logCategory,
        logDate,
        logNote,
        logType === 'saving' ? logGoalId : undefined
      );
      setLogAmount('');
      setLogNote('');
      setLogGoalId('');
      setShowLogModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = data.recentTransactions.filter(t => {
    const matchesSearch = t.note?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.date.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const txDate = new Date(t.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dateFilter === 'today') {
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        matchesDate = t.date === todayStr;
      } else if (dateFilter === 'week') {
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = txDate >= sevenDaysAgo;
      } else if (dateFilter === 'month') {
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = txDate >= thirtyDaysAgo;
      }
    }

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  // Calculate filtered totals
  const filteredTotalSaved = filteredTransactions
    .filter(t => t.type === 'saving')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredTotalSpent = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate distinct transaction categories for dropdown filter
  const distinctCategories = Array.from(new Set(data.recentTransactions.map(t => t.category)));

  // Progress to Monthly Savings Goal
  const monthlySavingsPercentage = Math.min(100, Math.round((data.weeklySavings * 4 / (data.monthlyGoal || 10000)) * 100));

  // Export CSV function
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Amount', 'Category', 'Note'];
    const rows = data.recentTransactions.map(t => [
      t.id,
      t.date,
      t.type,
      t.amount,
      t.category,
      t.note || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EduSave_Transactions_Backup.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="dashboard_view" className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm transition-all">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Workspace Dashboard</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Synced Securely
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Welcome back {user?.name || 'Student'}. Check out your habits and unlock achievements.
          </p>
        </div>

        {/* Motivational Card */}
        <div className="flex items-start gap-3 bg-emerald-50/50 dark:bg-emerald-950/15 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30 max-w-md">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-emerald-800 dark:text-emerald-300 italic font-medium leading-relaxed">
            "{quoteOfTheDay}"
          </p>
        </div>
      </div>

      {/* Main Core Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Savings Balance Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-5 -mt-5"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Savings Balance</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {currencySymbol}{data.balance.toLocaleString()}
            </h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              Total Saved: {currencySymbol}{data.totalDeposits.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Daily Savings Streak Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -mr-5 -mt-5"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Saving Streak</span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 rounded-lg">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {data.streak} {data.streak === 1 ? 'Day' : 'Days'}
            </h3>
            <p className="text-[10px] text-amber-500 dark:text-amber-400 font-medium flex items-center gap-0.5 mt-1">
              {data.streak > 0 ? (
                <>🔥 Maintain your consecutive record!</>
              ) : (
                <>💤 Log a savings deposit today to start streak</>
              )}
            </p>
          </div>
        </motion.div>

        {/* Today's Deposit Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full -mr-5 -mt-5"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Today's Savings</span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {currencySymbol}{data.todaySavings.toLocaleString()}
            </h3>
            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium flex items-center gap-0.5 mt-1">
              Weekly sum: {currencySymbol}{data.weeklySavings.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Monthly Savings Goal Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Monthly Target</span>
            <span className="p-2 bg-teal-50 dark:bg-teal-950/40 text-teal-500 dark:text-teal-400 rounded-lg">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-lg font-bold text-gray-950 dark:text-white">
                {monthlySavingsPercentage}%
              </span>
              <span className="text-[10px] text-gray-400">
                Goal: {currencySymbol}{data.monthlyGoal.toLocaleString()}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-1">
              <div 
                className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${monthlySavingsPercentage}%` }}
              ></div>
            </div>
            <span className="text-[9px] text-gray-400">Estimated based on weekly data</span>
          </div>
        </motion.div>

      </div>

      {/* Linked Bank Account Widget */}
      <div id="bank_account_integration" className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Bank Account Integration</h3>
              <p className="text-[11px] text-gray-500">Link your student bank account to auto-save and transfer funds seamlessly.</p>
            </div>
          </div>
          
          <div>
            {user?.bankDetails?.isLinked ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-50 dark:bg-slate-900/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">{user.bankDetails.bankName}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-[9px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span> Connected
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    Acct: •••• {user.bankDetails.accountNumber.slice(-4)} | {user.bankDetails.accountName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEasySaveModal(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[10px] rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Instant Easy-Save
                  </button>
                  <button
                    onClick={handleOpenBankModal}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white font-medium text-[10px] rounded-lg transition-all cursor-pointer"
                  >
                    Manage Link
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleOpenBankModal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm shadow-emerald-500/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Link Bank Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Hub */}
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => handleOpenLogModal('saving')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all duration-150 inline-flex items-center gap-1.5 shadow-sm shadow-emerald-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Daily Savings
        </button>
        <button 
          onClick={() => handleOpenLogModal('expense')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all duration-150 inline-flex items-center gap-1.5 shadow-sm shadow-indigo-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Daily Expense
        </button>
        <button 
          onClick={handleExportCSV}
          className="bg-white hover:bg-gray-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 font-medium text-xs px-4 py-2.5 rounded-xl transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <Download className="w-4 h-4" />
          Export CSV Backup
        </button>
      </div>

      {/* Transactions Log Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Transaction & Savings Log</h3>
            <p className="text-[11px] text-gray-500">Search and filter your entire history</p>
          </div>

          {/* Filtering Tools Row */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48"
              />
            </div>

            {/* Type Toggle Filter */}
            <div className="flex bg-gray-100 dark:bg-slate-700 p-0.5 rounded-lg text-xs">
              <button 
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${typeFilter === 'all' ? 'bg-white dark:bg-slate-800 font-semibold shadow-xs text-gray-900 dark:text-white' : 'text-gray-500'}`}
              >
                All
              </button>
              <button 
                onClick={() => setTypeFilter('saving')}
                className={`px-2.5 py-1 rounded-md transition-all ${typeFilter === 'saving' ? 'bg-emerald-500 text-white font-semibold shadow-xs' : 'text-gray-500'}`}
              >
                Saved
              </button>
              <button 
                onClick={() => setTypeFilter('expense')}
                className={`px-2.5 py-1 rounded-md transition-all ${typeFilter === 'expense' ? 'bg-indigo-500 text-white font-semibold shadow-xs' : 'text-gray-500'}`}
              >
                Expenses
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {distinctCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week (Last 7 Days)</option>
              <option value="month">This Month (Last 30 Days)</option>
            </select>

          </div>
        </div>

        {/* Filtered Data Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 pb-2">
          <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/20 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">Total Saved (Filtered)</p>
              <h4 className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {currencySymbol}{filteredTotalSaved.toLocaleString()}
              </h4>
              <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">
                {filteredTransactions.filter(t => t.type === 'saving').length} savings entries
              </p>
            </div>
            <div className="p-2.5 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/60 dark:border-indigo-900/20 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-indigo-600 dark:text-indigo-400">Total Spent (Filtered)</p>
              <h4 className="text-base sm:text-lg font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                {currencySymbol}{filteredTotalSpent.toLocaleString()}
              </h4>
              <p className="text-[9px] text-indigo-600/70 dark:text-indigo-400/60 mt-0.5">
                {filteredTransactions.filter(t => t.type === 'expense').length} expense entries
              </p>
            </div>
            <div className="p-2.5 bg-indigo-100/50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <TrendingDown className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        {/* Transactions Table/List */}
        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-gray-400 dark:text-gray-500">No matching log entries found. Start saving or log your expenditures!</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 text-gray-400 text-[10px] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 font-medium">Type</th>
                  <th className="py-2.5 font-medium">Date</th>
                  <th className="py-2.5 font-medium">Category</th>
                  <th className="py-2.5 font-medium">Note</th>
                  <th className="py-2.5 font-medium text-right">Amount</th>
                  <th className="py-2.5 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/40 text-xs">
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="py-3 pr-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        t.type === 'saving' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {t.type === 'saving' ? (
                          <>
                            <ArrowDownRight className="w-2.5 h-2.5" />
                            Saved
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                            Expense
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.date}</td>
                    <td className="py-3 font-semibold text-gray-800 dark:text-gray-200">{t.category}</td>
                    <td className="py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">{t.note || '—'}</td>
                    <td className="py-3 font-bold text-right">
                      <span className={t.type === 'saving' ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}>
                        {t.type === 'saving' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button 
                        onClick={() => onDeleteTransaction(t.id)}
                        className="text-gray-400 hover:text-rose-500 p-1 rounded-md transition-colors inline-block"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Transaction Logging Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 dark:border-slate-700/80"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-slate-700/80">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Log Daily {logType === 'saving' ? 'Savings' : 'Expense'}
              </h3>
              <button 
                onClick={() => setShowLogModal(false)}
                className="text-gray-400 hover:text-gray-500 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Amount ({currencySymbol})</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500"
                  value={logAmount}
                  onChange={(e) => setLogAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select
                  value={logCategory}
                  onChange={(e) => setLogCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {logType === 'saving' 
                    ? SAVING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                    : EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>

              {logType === 'saving' && data.goals.filter(g => g.status === 'active').length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Directly Allocate to Savings Goal? (Optional)</label>
                  <select
                    value={logGoalId}
                    onChange={(e) => setLogGoalId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">No specific goal allocation (General Savings)</option>
                    {data.goals.filter(g => g.status === 'active').map(g => (
                      <option key={g.id} value={g.id}>{g.name} (Need {currencySymbol}{(g.targetAmount - g.currentAmount).toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Optional Note / Inspiration</label>
                <textarea
                  placeholder="e.g. Skipped canteen soda, walked from main gate."
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Log Transaction'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Bank Details Management Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 dark:border-slate-700/80"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-slate-700/80">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-emerald-500" />
                Link Your Bank Details
              </h3>
              <button 
                onClick={() => setShowBankModal(false)}
                className="text-gray-400 hover:text-gray-500 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveBankDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select / Input Bank Name</label>
                <select
                  value={bankNameInput}
                  onChange={(e) => setBankNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="GTBank">Guaranty Trust Bank (GTBank)</option>
                  <option value="Access Bank">Access Bank</option>
                  <option value="Kuda Bank">Kuda Bank (Microfinance)</option>
                  <option value="Zenith Bank">Zenith Bank</option>
                  <option value="UBA">United Bank for Africa (UBA)</option>
                  <option value="First Bank">First Bank of Nigeria</option>
                  <option value="Sterling Bank">Sterling Bank</option>
                  <option value="Opay">OPay Digital Bank</option>
                  <option value="Moniepoint">Moniepoint Microfinance Bank</option>
                  <option value="Chase Bank">Chase Bank</option>
                  <option value="Bank of America">Bank of America</option>
                  <option value="Barclays">Barclays Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{10,12}"
                  placeholder="e.g. 0123456789"
                  value={bankAccountInput}
                  onChange={(e) => setBankAccountInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono tracking-wider"
                />
                <span className="text-[10px] text-gray-400">10-digit NUBAN or account standard</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tunde Alabi"
                  value={bankHolderInput}
                  onChange={(e) => setBankHolderInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30">
                <p className="text-[10px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  🔒 EduSave uses encrypted bank link simulation. No actual bank credentials or logins are required or captured. Your security is our peak priority.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  disabled={bankSyncing}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-semibold py-2 rounded-lg text-xs transition-all text-center cursor-pointer"
                >
                  Cancel
                </button>
                {user?.bankDetails?.isLinked && (
                  <button
                    type="button"
                    onClick={handleUnlinkBank}
                    disabled={bankSyncing}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 font-medium py-2 rounded-lg text-xs transition-all text-center cursor-pointer"
                  >
                    Unlink Account
                  </button>
                )}
                <button
                  type="submit"
                  disabled={bankSyncing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer font-bold"
                >
                  {bankSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : (user?.bankDetails?.isLinked ? 'Update Link' : 'Link Bank')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Easy-Save Modal */}
      {showEasySaveModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 dark:border-slate-700/80"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-slate-700/80">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Instant Easy-Save Transfer
              </h3>
              <button 
                onClick={() => setShowEasySaveModal(false)}
                className="text-gray-400 hover:text-gray-500 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleEasySaveSubmit} className="space-y-4">
              <div className="bg-gray-50 dark:bg-slate-900 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-gray-500">Source Account</span>
                  <span className="font-bold text-xs text-gray-900 dark:text-white">{user?.bankDetails?.bankName}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-gray-500">Account Number</span>
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300">•••• {user?.bankDetails?.accountNumber?.slice(-4)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Amount to Transfer ({currencySymbol})</label>
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {[500, 1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setEasySaveAmount(amt.toString())}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        easySaveAmount === amt.toString()
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                
                <input
                  type="number"
                  required
                  placeholder="Or enter custom amount"
                  value={easySaveAmount}
                  onChange={(e) => setEasySaveAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              {data.goals.filter(g => g.status === 'active').length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Directly Allocate to Savings Goal? (Optional)</label>
                  <select
                    value={easySaveGoalId}
                    onChange={(e) => setEasySaveGoalId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">No specific goal allocation (General Savings)</option>
                    {data.goals.filter(g => g.status === 'active').map(g => (
                      <option key={g.id} value={g.id}>{g.name} (Need {currencySymbol}{(g.targetAmount - g.currentAmount).toLocaleString()})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEasySaveModal(false)}
                  disabled={easySaving}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-semibold py-2 rounded-lg text-sm transition-all text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={easySaving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm shadow-emerald-500/10 font-bold"
                >
                  {easySaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}

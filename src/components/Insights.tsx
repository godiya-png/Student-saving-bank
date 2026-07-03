/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';
import { Sparkles, TrendingUp, RefreshCw, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import { DashboardData } from '../types';

interface InsightsProps {
  data: DashboardData;
  onRefresh: () => void;
  currencySymbol: string;
}

// Simple custom markdown renderer since we want safe, compliant rendering
function SafeMarkdown({ content }: { content: string }) {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');

  return (
    <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith('###')) {
          return <h4 key={idx} className="text-xs font-bold text-gray-900 dark:text-white pt-2 flex items-center gap-1.5">{trimmed.replace('###', '').trim()}</h4>;
        }
        if (trimmed.startsWith('####')) {
          return <h5 key={idx} className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-2">{trimmed.replace('####', '').trim()}</h5>;
        }
        if (trimmed.startsWith('##')) {
          return <h3 key={idx} className="text-sm font-bold text-gray-900 dark:text-white pt-3 border-b border-gray-100 dark:border-slate-700/50 pb-1">{trimmed.replace('##', '').trim()}</h3>;
        }

        // Bullet points
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const text = trimmed.substring(1).trim();
          // Render bold parts e.g. **Food**
          return (
            <div key={idx} className="pl-4 relative flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
              <span>{parseBold(text)}</span>
            </div>
          );
        }

        // Empty lines
        if (trimmed === '') return <div key={idx} className="h-1"></div>;

        // Standard Paragraphs
        return <p key={idx}>{parseBold(trimmed)}</p>;
      })}
    </div>
  );
}

// Helper to parse **bold** text in markdown lines
function parseBold(text: string) {
  const parts = text.split('**');
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-bold text-gray-950 dark:text-white">{part}</strong>;
    }
    return part;
  });
}

export default function Insights({ data, onRefresh, currencySymbol }: InsightsProps) {
  const [aiAdvice, setAiAdvice] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [errorAI, setErrorAI] = useState('');
  const [isAIReal, setIsAIReal] = useState(false);

  // Fetch AI Insights from server-side endpoint
  const fetchAIInsights = async () => {
    setLoadingAI(true);
    setErrorAI('');
    try {
      const token = localStorage.getItem('edusave_token');
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Failed to fetch AI insights');
      setAiAdvice(responseData.advice);
      setIsAIReal(responseData.isAI);
    } catch (err: any) {
      setErrorAI(err.message || 'AI coach currently taking a quick study break. Click below to try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    fetchAIInsights();
  }, [data.recentTransactions.length]); // Refresh advice when transaction length changes

  // CHART DATA COMPILATION
  
  // 1. Expense Pie Chart Data
  const expenseCategories: Record<string, number> = {};
  data.recentTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
    });

  const totalExpense = Object.values(expenseCategories).reduce((sum, val) => sum + val, 0);

  const pieColors = ['#10B981', '#6366F1', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6', '#F43F5E', '#A1A1AA'];
  const pieChartData = Object.entries(expenseCategories).map(([name, value], i) => ({
    name,
    value,
    percentage: totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0,
    color: pieColors[i % pieColors.length]
  }));

  // 2. Weekly comparison (Savings vs Spending) Data
  // Group by last 7 days
  const barChartData: any[] = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = days[d.getDay()];

    const daySavings = data.recentTransactions
      .filter(t => t.type === 'saving' && t.date === dateStr)
      .reduce((sum, t) => sum + t.amount, 0);

    const daySpending = data.recentTransactions
      .filter(t => t.type === 'expense' && t.date === dateStr)
      .reduce((sum, t) => sum + t.amount, 0);

    barChartData.push({
      name: dayLabel,
      Savings: daySavings,
      Spending: daySpending
    });
  }

  // 3. Savings growth line chart
  // Group transactions chronologically and make cumulative savings array
  const chronologicalTransactions = [...data.recentTransactions]
    .filter(t => t.type === 'saving')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let rollingTotal = 0;
  const lineChartData = chronologicalTransactions.map(t => {
    rollingTotal += t.amount;
    return {
      date: t.date,
      Cumulative: rollingTotal
    };
  }).slice(-10); // Take last 10 saving data points to avoid overflow

  return (
    <div id="insights_view" className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-sans">EduSave Savings Insights</h2>
          <p className="text-xs text-gray-500">Intelligent financial breakdown and AI academic companion advice</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-400 hover:text-emerald-500 rounded-xl transition-all border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800"
          title="Refresh Dashboard Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Analytics Charts */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Chart 1: Spending distribution Pie chart */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Expenditure Category Distribution</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-6 h-48 relative">
                {totalExpense > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${currencySymbol}${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                    <p className="text-xs text-gray-400">Log expenditures to see your category distribution</p>
                  </div>
                )}
              </div>

              {/* Pie Legends */}
              <div className="sm:col-span-6 space-y-2 text-xs max-h-48 overflow-y-auto">
                {pieChartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-1.5 hover:bg-gray-50/50 dark:hover:bg-slate-700/20 rounded">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="font-mono text-gray-500 dark:text-gray-400 font-bold">
                      {item.percentage}% ({currencySymbol}{item.value.toLocaleString()})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2: Dual Bars (Weekly Savings vs Expenditures) */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Weekly Financial Flows comparison</h3>
            <p className="text-[10px] text-gray-400 mb-4">Comparing logged daily savings versus outgoing daily spending over the last 7 days</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#A0AEC0" fontSize={10} />
                  <YAxis stroke="#A0AEC0" fontSize={10} />
                  <Tooltip formatter={(value) => `${currencySymbol}${Number(value).toLocaleString()}`} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Savings" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spending" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Line Chart (Cumulative Savings Trend) */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">EduSave Savings Accumulation Line</h3>
            <p className="text-[10px] text-gray-400 mb-4">Visualizing your continuous net growth trajectory over saved logs</p>
            <div className="h-52">
              {lineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="#A0AEC0" fontSize={9} />
                    <YAxis stroke="#A0AEC0" fontSize={10} />
                    <Tooltip formatter={(value) => `${currencySymbol}${Number(value).toLocaleString()}`} />
                    <Line type="monotone" dataKey="Cumulative" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <p className="text-xs text-gray-400">Log multiple savings transactions to trace your cumulative trajectory curve</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: AI Financial Coaching Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-950 shadow-md shadow-emerald-500/5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-8 -mt-8"></div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white">EduSave AI Financial Coach</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-semibold inline-flex items-center gap-0.5 mt-0.5">
                    {isAIReal ? 'Gemini 3.5 Flash Powered' : 'Smart Rule-Based Engine'}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={fetchAIInsights}
                disabled={loadingAI}
                className="text-gray-400 hover:text-emerald-500 p-1 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                title="Regenerate Report Advice"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAI ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* AI Coaching Outputs */}
            <div className="min-h-96 max-h-160 overflow-y-auto pr-1">
              {loadingAI ? (
                <div className="space-y-3 py-12 text-center flex flex-col items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                  <p className="text-xs text-gray-400">EduSave Coach is analyzing your transactions, goal deadlines, and budget ratios...</p>
                </div>
              ) : errorAI ? (
                <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 p-4 rounded-xl text-center space-y-2 border border-rose-100 dark:border-rose-900/40">
                  <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
                  <p className="text-xs">{errorAI}</p>
                  <button 
                    onClick={fetchAIInsights}
                    className="text-[10px] font-bold text-white bg-rose-500 hover:bg-rose-600 py-1 px-3 rounded-md cursor-pointer inline-block"
                  >
                    Retry Analysis
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <SafeMarkdown content={aiAdvice} />
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="border-t border-gray-100 dark:border-slate-700/60 pt-4 mt-4 text-[10px] text-gray-400 flex items-start gap-1.5 leading-relaxed">
            <BookOpen className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p>
              Your AI coach continuously studies your weekly habits. Log both off-campus grocery runs and side hustle stipends so the coach can formulate increasingly precise financial optimization pathways for you.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

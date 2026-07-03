/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CreditCard, ArrowUpRight, Check, RefreshCw } from 'lucide-react';
import { Budget } from '../types';

interface BudgetPlannerProps {
  budget: Budget;
  actualSpend: { needs: number; wants: number; savings: number };
  onUpdateBudget: (updates: Partial<Budget>) => Promise<void>;
  currencySymbol: string;
}

export default function BudgetPlanner({ budget, actualSpend, onUpdateBudget, currencySymbol }: BudgetPlannerProps) {
  // Inputs matching the requested categories
  const [allowance, setAllowance] = useState(String(budget.allowance));
  const [pocketMoney, setPocketMoney] = useState(String(budget.pocketMoney));
  const [scholarship, setScholarship] = useState(String(budget.scholarship));
  const [sideHustle, setSideHustle] = useState(String(budget.sideHustle));
  const [income, setIncome] = useState(String(budget.income));

  // Custom allocation overrides (default to 50 / 30 / 20)
  const [needsPercent, setNeedsPercent] = useState(budget.needsPercent || 50);
  const [wantsPercent, setWantsPercent] = useState(budget.wantsPercent || 30);
  const [savingsPercent, setSavingsPercent] = useState(budget.savingsPercent || 20);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalInflow = 
    Number(allowance) + 
    Number(pocketMoney) + 
    Number(scholarship) + 
    Number(sideHustle) + 
    Number(income);

  // Suggested values based on allocation percentages
  const suggestedNeeds = totalInflow * (needsPercent / 100);
  const suggestedWants = totalInflow * (wantsPercent / 100);
  const suggestedSavings = totalInflow * (savingsPercent / 100);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (needsPercent + wantsPercent + savingsPercent !== 100) return;
    setLoading(true);
    setSuccess(false);

    try {
      await onUpdateBudget({
        allowance: Number(allowance),
        pocketMoney: Number(pocketMoney),
        scholarship: Number(scholarship),
        sideHustle: Number(sideHustle),
        income: Number(income),
        needsPercent,
        wantsPercent,
        savingsPercent
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Chart Data preparation
  const chartData = [
    { name: `Needs (${needsPercent}%)`, value: suggestedNeeds, color: '#10B981' }, // Emerald Green
    { name: `Wants (${wantsPercent}%)`, value: suggestedWants, color: '#6366F1' }, // Indigo
    { name: `Savings (${savingsPercent}%)`, value: suggestedSavings, color: '#F59E0B' } // Gold
  ];

  const actualChartData = [
    { name: 'Actual Expenses (Needs/Wants)', value: actualSpend.needs + actualSpend.wants, color: '#6366F1' },
    { name: 'Actual Savings Saved', value: actualSpend.savings, color: '#10B981' }
  ];

  return (
    <div id="budget_view" className="space-y-6">
      
      {/* View Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Smart Student Budget Planner</h2>
        <p className="text-xs text-gray-500">Track study inflows and structure balanced allocations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Form Column */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white tracking-wide uppercase">Monthly Academic Inflows</h3>
          
          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold mb-1">Monthly Allowance ({currencySymbol})</label>
                <input
                  type="number"
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold mb-1">Pocket Money ({currencySymbol})</label>
                <input
                  type="number"
                  value={pocketMoney}
                  onChange={(e) => setPocketMoney(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold mb-1">Scholarship</label>
                <input
                  type="number"
                  value={scholarship}
                  onChange={(e) => setScholarship(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold mb-1">Side Hustles</label>
                <input
                  type="number"
                  value={sideHustle}
                  onChange={(e) => setSideHustle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 font-semibold mb-1">Other Income</label>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Allocation ratio slider panel */}
            <div className="border-t border-gray-50 dark:border-slate-700/60 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-500">Allocation Target Ratio</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${
                  needsPercent + wantsPercent + savingsPercent === 100 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-rose-50 text-rose-600'
                }`}>
                  Sum: {needsPercent + wantsPercent + savingsPercent}% (Must be 100%)
                </span>
              </div>

              {/* Dynamic Ratio Configuration Sliders */}
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between mb-0.5 text-[10px] text-gray-400">
                    <span>Needs: Books, Tuition, Hostel rent ({needsPercent}%)</span>
                    <span>Standard: 50%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={needsPercent}
                    onChange={(e) => setNeedsPercent(Number(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-0.5 text-[10px] text-gray-400">
                    <span>Wants: Gadgets, Fast Food, Cinema ({wantsPercent}%)</span>
                    <span>Standard: 30%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={wantsPercent}
                    onChange={(e) => setWantsPercent(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-0.5 text-[10px] text-gray-400">
                    <span>Savings: EduSave Vault, Investments ({savingsPercent}%)</span>
                    <span>Standard: 20%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="55"
                    step="5"
                    value={savingsPercent}
                    onChange={(e) => setSavingsPercent(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (needsPercent + wantsPercent + savingsPercent !== 100)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-200 dark:disabled:bg-slate-700 text-white font-semibold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : success ? (
                <>
                  <Check className="w-4 h-4" />
                  Budget Settings Saved!
                </>
              ) : (
                'Save smart Budget Plan'
              )}
            </button>
          </form>
        </div>

        {/* Visual Charts Allocation Display Column */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-xs flex flex-col justify-between space-y-4">
          
          <div className="flex justify-between items-baseline border-b border-gray-50 dark:border-slate-700/60 pb-3">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">Target Allocation</h3>
              <p className="text-[10px] text-gray-400">Suggested savings structure based on total academic inflows</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block font-medium">Total Inflows</span>
              <span className="text-base font-extrabold text-gray-950 dark:text-white">
                {currencySymbol}{totalInflow.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            
            {/* Recharts Pie Chart display */}
            <div className="sm:col-span-7 h-52 relative">
              {totalInflow > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${currencySymbol}${Number(value).toLocaleString()}`, 'Recommended']} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                  <p className="text-xs text-gray-400">Enter your monthly allowance or pocket money to generate allocation chart</p>
                </div>
              )}
            </div>

            {/* Custom styled breakdown list */}
            <div className="sm:col-span-5 space-y-3">
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <span className="text-[10px] text-emerald-600 font-semibold block">Suggested Needs ({needsPercent}%)</span>
                <span className="text-sm font-bold text-gray-950 dark:text-white">
                  {currencySymbol}{suggestedNeeds.toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">Rent, text-books, basic feeding</span>
              </div>

              <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                <span className="text-[10px] text-indigo-600 font-semibold block">Suggested Wants ({wantsPercent}%)</span>
                <span className="text-sm font-bold text-gray-950 dark:text-white">
                  {currencySymbol}{suggestedWants.toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">Subscriptions, entertainment, outings</span>
              </div>

              <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <span className="text-[10px] text-amber-600 font-semibold block">Suggested Savings ({savingsPercent}%)</span>
                <span className="text-sm font-bold text-gray-950 dark:text-white">
                  {currencySymbol}{suggestedSavings.toLocaleString()}
                </span>
                <span className="text-[9px] text-gray-400 block mt-0.5">EduSave Vault deposits, goals</span>
              </div>
            </div>

          </div>

          {/* Educational Note */}
          <div className="bg-gray-50 dark:bg-slate-900/40 p-3 rounded-xl text-[10px] text-gray-500 flex items-start gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <p className="leading-relaxed">
              <strong>Smart Recommendation:</strong> Budgeting as a student is crucial. The standard 50/30/20 division ensures you cover tuition fees and hostel rent first (Needs), allow reasonable lifestyle spending (Wants), and accumulate reserves for emergency situations (Savings).
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

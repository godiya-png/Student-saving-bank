/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator as CalcIcon, PiggyBank, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';

interface CalculatorProps {
  currencySymbol: string;
}

export default function Calculator({ currencySymbol }: CalculatorProps) {
  const [dailySavings, setDailySavings] = useState(300); // default N300/day
  const [interestRate, setInterestRate] = useState(0); // 0% by default, supports simulated savings yields (e.g. 5% per annum)

  // Future projection calculators
  const calculateAccumulated = (days: number) => {
    const baseSavings = dailySavings * days;
    if (interestRate === 0) return baseSavings;

    // Daily compounded simulated interest
    const dailyRate = (interestRate / 100) / 365;
    let total = 0;
    for (let i = 0; i < days; i++) {
      total = (total + dailySavings) * (1 + dailyRate);
    }
    return Math.round(total);
  };

  const projections = [
    { label: '30 Days (1 Month)', days: 30, value: calculateAccumulated(30), category: 'Short-term', icon: '🌱' },
    { label: '3 Months (90 Days)', days: 90, value: calculateAccumulated(90), category: 'Academic Books', icon: '📖' },
    { label: '6 Months (180 Days)', days: 180, value: calculateAccumulated(180), category: 'Hostel Rent Buffer', icon: '🏠' },
    { label: '1 Year (365 Days)', days: 365, value: calculateAccumulated(365), category: 'Coding Laptop / Tech', icon: '💻' }
  ];

  // Helper: Visual milestone suggestions based on daily savings
  const getMilestoneUnlocksText = () => {
    const totalOneYear = calculateAccumulated(365);
    if (totalOneYear < 50000) {
      return "Excellent for covering textbooks and transport stipends. Try bumping up slightly to secure hostel rent!";
    } else if (totalOneYear < 150000) {
      return "Fantastic pace! This safely covers most textbook budgets, pocket allowances, and campus transport fees.";
    } else if (totalOneYear < 300000) {
      return "Superb trajectory! You will comfortably secure tuition fees and semester accommodation, with pocket cushion left.";
    } else {
      return "Outstanding! You are on pace to completely fund premium laptops, university projects, or post-graduation buffer funds on your own!";
    }
  };

  return (
    <div id="calculator_view" className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Savings Forecasting Calculator</h2>
        <p className="text-xs text-gray-500">Visualize exactly how consistent micro-savings scale over time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Input Configuration Panel */}
        <div className="md:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
              <CalcIcon className="w-4 h-4 text-emerald-500" />
              Adjust Contributions
            </h3>

            {/* Daily savings slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-xs font-semibold">
                <span className="text-gray-500">Daily Savings Contribution</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  {currencySymbol}{dailySavings.toLocaleString()} / Day
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={dailySavings}
                onChange={(e) => setDailySavings(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>{currencySymbol}50/day</span>
                <span>{currencySymbol}5,000/day</span>
              </div>
            </div>

            {/* Interest Rate selector */}
            <div className="space-y-2 pt-2 border-t border-gray-50 dark:border-slate-700/60">
              <div className="flex justify-between items-baseline text-xs font-semibold">
                <span className="text-gray-500">Simulated Safe Yield (APY)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  {interestRate}% APY
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
              />
              <p className="text-[9px] text-gray-400 leading-normal">
                Simulate holding your money in high-yield student savings wallets (e.g. digital banks offering interest yields).
              </p>
            </div>
          </div>

          {/* Forecast Analysis Quote */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/15 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-900/40 text-xs">
            <span className="font-bold text-emerald-800 dark:text-emerald-400 block mb-1">🎯 Milestone Outlook:</span>
            <p className="text-emerald-700 dark:text-emerald-300 leading-relaxed font-medium">
              {getMilestoneUnlocksText()}
            </p>
          </div>

        </div>

        {/* Projection Outputs Panel */}
        <div className="md:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-between space-y-4">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Future Projections</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projections.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl border border-gray-50 dark:border-slate-700/50 hover:border-emerald-500/10 hover:bg-emerald-500/5 transition-all flex items-center gap-4.5"
              >
                <div className="text-3xl p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-xs">
                  {item.icon}
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block">{item.label}</span>
                  <span className="text-base font-extrabold text-gray-950 dark:text-white block mt-0.5">
                    {currencySymbol}{item.value.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold block mt-1">
                    🎯 Perfect for: {item.category}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Educational Formula Note */}
          <div className="bg-indigo-50/30 dark:bg-indigo-950/15 p-3.5 rounded-xl border border-indigo-100/30 text-[10px] text-gray-500 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p>
              <strong>The Power of Compound Interest:</strong> Over short horizons, your balance is driven purely by your daily deposits. Over longer horizons (like 1 Year or more), safe APY compounding takes effect, multiplying your initial contributions. Starting early is the absolute key to student financial security.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
